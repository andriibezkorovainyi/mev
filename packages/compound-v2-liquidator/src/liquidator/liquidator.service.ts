import { Service } from '../../utils/classes/service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import {
  div_MantissaB,
  mul_Mantissa,
  mulScalarTruncateAddUInt,
} from '../../utils/math/ExpNoError.ts';
import type { AccountEntity } from '../account/account.entity.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { AccountService } from '../account/account.service.ts';
import LiqBot_v1 from '../../artifacts/LiqBot_v1.sol/LiqBot_v1.json';
import { deepCopy } from '../../../../common/helpers/deepCopy.ts';
import type { ILiquidationData } from '../../utils/interfaces/liquidation-data.interface.ts';
import Env from '../../utils/constants/env.ts';
import { findAsset } from '../../utils/helpers/array.helpers.ts';
import type {
  IPendingPriceConfig,
  IPendingPriceUpdateData,
  PendingPriceUpdateMessage,
} from '../mempool/pending-price-update.message.ts';
import type { BundleService } from '../bundle/bundle.service.ts';
import { WETH_ADDRESS } from './liquidator.constants.ts';
import type { TelegramService } from '../telegram/telegram.service.ts';
import type { SignTransactionResult } from 'web3-eth-accounts';
import {
  AllowedBorrowMarkets,
  CSaiSymbolHash,
  EthSymbolHash,
} from '../mempool/mempool.constants.ts';
import Path from '../../artifacts/network/Path.json';
import { getDateString } from '../../../../common/helpers/getDateString.ts';
import type { IExecuteLiquidationData } from '../../utils/interfaces/execute-liquidation-data.interface.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { MarketEntity } from '../market/market.entity.ts';
import { Web3 } from 'web3';
import type { ITxData } from '../../utils/interfaces/tx-data.interface.ts';

export class LiquidatorService extends Service {
  private readonly txData = new Map<string, ITxData>();

  constructor(
    private readonly storageService: StorageService,
    private readonly priceOracleService: PriceOracleService,
    private readonly web3Service: Web3Service,
    private readonly accountService: AccountService,
    private readonly bundleService: BundleService,
    private readonly telegramService: TelegramService,
  ) {
    super();
  }

  async processPendingPriceUpdate(message: PendingPriceUpdateMessage) {
    console.log('method -> liquidatorService.processPendingPriceUpdate');
    const { pendingPriceConfig, targetTxHash } = message.data;

    const { tokenConfigs, markets, oldPrices } = this.setupLiquidation(
      message.data,
    );

    this.getEntities(tokenConfigs, markets, pendingPriceConfig);

    this.mutateUpdatePrices(
      tokenConfigs,
      oldPrices,
      markets,
      pendingPriceConfig,
    );

    if (!markets.length) {
      throw new Error('No markets found');
    }

    await this.performCalculations(markets, pendingPriceConfig);

    console.log(
      'markets',
      markets.map(({ symbol }) => symbol),
    );
    const { targetTxRaw, liquidationData, biggestBorrow } = this.txData.get(
      pendingPriceConfig.symbolHash,
    )!;

    console.log('total victims:', liquidationData._repayTokens.length);
    console.log('_repayToken', liquidationData._repayTokens);
    console.log('_cMarket', liquidationData._cMarkets);
    console.log('_borrower', liquidationData._borrowers);
    console.log('_repayAmount', liquidationData._repayAmounts);
    console.log('_cMarketCollateral', liquidationData._cMarketCollaterals);
    console.log('_path', liquidationData._path);

    if (liquidationData._repayTokens.length === 0) {
      this.txData.delete(pendingPriceConfig.symbolHash);
      return;
    }

    const blockNumber = this.storageService.getNetworkHeight() + 1;

    const collectDetails = (tx?: SignTransactionResult) => {
      console.log('targetTxRaw', targetTxRaw);
      console.log('createdTxRaw', tx?.rawTransaction);

      return [
        '----------------------',
        'Arguments:',
        ...Object.entries(liquidationData).map(
          ([key, value]) => `${key}: ${JSON.stringify(value)}`,
        ),
        '----------------------',
        'Transactions:',
        `created: ${tx?.transactionHash || 'not created'}`,
        `target: ${targetTxHash}`,
        '----------------------',
        'Additional:',
        `blockNumber: ${blockNumber}`,
        `serverTime: ${getDateString()}`,
      ];
    };

    this.mutateGetBiggestLiquidationData(liquidationData, biggestBorrow.index);

    const tx = await this.createLiquidationTx(liquidationData, collectDetails);

    if (!tx) {
      this.txData.delete(pendingPriceConfig.symbolHash);
      await this.sendLiquidationErrorToTelegram([
        'Reason: tx was not created',
        ...collectDetails(),
      ]);
      return;
    }

    console.log('txHash', tx.transactionHash);

    const bundleHash = await this.executeLiquidation({
      targetTxRaw,
      tx,
      blockNumber,
      collectDetails,
    });

    console.log('bundleHash', bundleHash);

    const isTargetTxValid = await this.validateTargetTx(
      targetTxHash,
      blockNumber,
    );

    if (!isTargetTxValid) {
      return;
    }

    await this.reportLiquidationExecutionResult(bundleHash, tx, collectDetails);

    this.mutateResetPrices(tokenConfigs, markets, oldPrices);

    this.txData.delete(pendingPriceConfig.symbolHash);
  }

  async validateTargetTx(targetTxHash: string, blockNumber: number) {
    const targetTx = await this.web3Service.getTransaction(targetTxHash);
    const txBlockNumber: number = Number(targetTx?.blockNumber);

    let isValid = true;

    if (!targetTx) {
      // skip
    } else if (Number.isNaN(txBlockNumber)) {
      // skip
    }
    if (txBlockNumber < blockNumber) {
      isValid = false;
    }

    return isValid;
  }

  mutateGetBiggestLiquidationData(
    liquidationData: ILiquidationData,
    biggestBorrowIndex: number,
  ) {
    for (const key in liquidationData) {
      // @ts-ignore
      liquidationData[key] = (liquidationData[key] as string[]).filter(
        (_, index) => index === biggestBorrowIndex,
      );
    }
    // const args = Object.values(liquidationData);
    //
    // const biggestBorrow = args.reduce((acc, data) => {
    //   acc.push([data[biggestBorrowIndex]]);
    //   return acc;
    // }, []);
    //
    // return biggestBorrow;
  }

  setupLiquidation({
    targetTxHash,
    targetTxRaw,
    pendingPriceConfig,
  }: IPendingPriceUpdateData) {
    console.log('method -> liquidatorService.setupLiquidation');
    this.txData.set(pendingPriceConfig.symbolHash, {
      targetTxRaw,
      targetTxHash,
      liquidationData: {
        _repayTokens: [],
        _cMarkets: [],
        _borrowers: [],
        _repayAmounts: [],
        _cMarketCollaterals: [],
        _path: [],
      },
      biggestBorrow: {
        value: 0n,
        index: -1,
      },
    });

    const oldPrices: bigint[] = [];
    const markets: MarketEntity[] = [];
    const tokenConfigs: TokenConfigEntity[] = [];

    return { tokenConfigs, markets, oldPrices };
  }

  mutateResetPrices(
    tokenConfigs: TokenConfigEntity[],
    markets: MarketEntity[],
    oldPrices: bigint[],
  ) {
    console.log('method -> liquidatorService.mutateResetPrices');
    for (let i = 0; i < tokenConfigs.length; i++) {
      const tokenConfig = tokenConfigs[i];
      const market = markets[i];
      // Reset prices to avoid affecting other calculations
      tokenConfig.price = oldPrices.shift()!;
      market.pendingUnderlyingPriceMantissa = 0n;
    }
  }

  async performCalculations(
    markets: MarketEntity[],
    pendingPriceConfig: IPendingPriceConfig,
  ) {
    const accounts = Array.from(
      markets.reduce((acc, market) => {
        market.accounts.forEach((address) => acc.add(address));
        return acc;
      }, new Set<string>()),
    );

    console.log('Account quantity:', accounts.length);

    await Promise.all(
      accounts.map((account) =>
        this.findLiquidationData(account, pendingPriceConfig.symbolHash),
      ),
    );
  }

  getEntities(
    tokenConfigs: TokenConfigEntity[],
    markets: MarketEntity[],
    pendingPriceConfig: IPendingPriceConfig,
  ) {
    tokenConfigs.push(
      ...this.storageService.getTokenConfigsBySymbolHash(
        pendingPriceConfig.symbolHash,
      ),
    );

    if (pendingPriceConfig.symbolHash === EthSymbolHash) {
      const fixedEthTokenConfigs =
        this.storageService.getFixedEthTokenConfigs();
      tokenConfigs.push(...fixedEthTokenConfigs);
    }

    for (const tokenConfig of tokenConfigs) {
      markets.push(this.storageService.getMarket(tokenConfig.marketAddress));
    }
  }

  mutateUpdatePrices(
    tokenConfigs: TokenConfigEntity[],
    oldPrices: bigint[],
    markets: MarketEntity[],
    pendingPriceConfig: IPendingPriceConfig,
  ) {
    console.log('method -> liquidatorService.updatePrices');
    for (let i = 0; i < tokenConfigs.length; i++) {
      const tokenConfig = tokenConfigs[i];
      oldPrices.push(tokenConfig.price!);
      if (tokenConfig.symbolHash === pendingPriceConfig.symbolHash) {
        tokenConfig.price = pendingPriceConfig.price;
      }
      const newPendingUnderlyingPriceMantissa =
        this.priceOracleService.getUnderlyingPrice(tokenConfig);
      const market = markets[i];
      market.pendingUnderlyingPriceMantissa = newPendingUnderlyingPriceMantissa;

      console.log('pendingPriceConfig', pendingPriceConfig);
      console.log('market', market.symbol, market.address);
      console.log(
        'newPendingUnderlyingPriceMantissa',
        newPendingUnderlyingPriceMantissa,
      );
    }
  }

  async reportLiquidationExecutionResult(
    bundleHash: string | undefined,
    tx: SignTransactionResult,
    collectDetails: (arg?: any) => string[],
  ) {
    if (!bundleHash) {
      const parts = ['Reason: bundle was not created', ...collectDetails(tx)];
      await this.sendLiquidationErrorToTelegram(parts);
      return;
    }

    const bundleTrace =
      (await this.bundleService.traceBundle(bundleHash)) ||
      'No trace, most likely exceeded request limit';

    console.log('bundleTrace', bundleTrace);

    const sentTx = await this.web3Service.getTransaction(tx.transactionHash);

    const infoParts = [
      `bundleHash: ${bundleHash}`,
      `trace: ${JSON.stringify(bundleTrace, null, 2)}`,
      `createdTxStatus: ${sentTx?.blockNumber ? 'success' : 'failed'}`,
      ...collectDetails(tx),
    ];

    await this.sendLiquidationExecutionResultToTelegram(infoParts);
  }

  async sendLiquidationErrorToTelegram(parts: string[]) {
    const message =
      `Liquidation error:\n` +
      '----------------------\n' +
      `${parts.join('\n')}`;

    await this.telegramService.sendMessage(message);
  }

  async executeLiquidation({
    targetTxRaw,
    tx,
    blockNumber,
    collectDetails,
  }: IExecuteLiquidationData) {
    let bundleHash: string | undefined;
    try {
      bundleHash = await this.bundleService.submitBundleBLXR(blockNumber, [
        targetTxRaw,
        tx.rawTransaction,
      ]);
    } catch (e) {
      console.error(e);
      await this.sendLiquidationErrorToTelegram([
        'reason: bundle submission error',
        `message: ${e.message}`,
        ...collectDetails(tx),
      ]);
    }

    return bundleHash;
  }

  async sendLiquidationExecutionResultToTelegram(parts: string[]) {
    const message =
      `Liquidation execution result:\n` +
      '----------------------\n' +
      parts.join('\n');

    await this.telegramService.sendMessage(message);
  }

  async findLiquidationData(address: string, symbolHash: string) {
    const account = this.storageService.getAccount(address)!;

    const [liquidity, shortfall] = this.calculateAccountLiquidity(account);

    if (liquidity > 0n || shortfall === 0n) {
      return;
    }

    // console.log('account', account.address);

    // console.log('liquidity', liquidity);
    // console.log('shortfall', shortfall);

    this.appendAccountLiqData(account, liquidity, symbolHash);
  }

  async createLiquidationTx(
    data: ILiquidationData,
    _collectDetails: () => string[],
  ) {
    console.log('method -> liquidatorService.createLiquidationTx');

    const address = Env.LIQUIDATOR_CONTRACT_ADDRESS;
    const abi = LiqBot_v1.abi.find((item) => item.name === 'liquidate');
    const args = Object.values(data);
    console.log('args', data);
    const maxFeePerGas = this.storageService.getBaseFeePerGas() * 2n;
    const gas = (args[0].length * 1_500_000).toString();

    // console.log('liquidationLoopData', liquidationLoopData);

    let tx: SignTransactionResult | undefined;
    try {
      tx = await this.web3Service.createAndSignTx({
        address,
        abi,
        args,
        gas,
        maxFeePerGas,
      });
    } catch (e) {
      console.error(e);

      await this.sendLiquidationErrorToTelegram([
        'reason: tx creation error',
        `message: ${e.message}`,
        `baseFeePerGas: ${Web3.utils.toWei(this.storageService.getBaseFeePerGas(), 'gwei')} gwei`,
        `maxFeePerGas: ${Web3.utils.toWei(maxFeePerGas, 'gwei')} gwei`,
        `gas: ${Web3.utils.toWei(gas, 'gwei')} gwei`,
        ..._collectDetails(),
      ]);
    }

    return tx;
  }

  appendAccountLiqData(
    _account: AccountEntity,
    initialLiquidity: bigint,
    symbolHash: string,
  ) {
    // console.log('method -> liquidatorService.searchLiquidationLoop');
    const account = deepCopy(_account);

    let liquidity = initialLiquidity;

    const { liquidationIncentiveMantissa } =
      this.storageService.getComptroller();

    while (liquidity === 0n) {
      const collateral = this.findCollateralToLiquidate(account);

      if (
        !this.isCollateralValueEnough(
          collateral.collateralValue,
          liquidationIncentiveMantissa!,
        )
      ) {
        break;
      }

      const borrow = this.findBorrowToLiquidate(account);
      if (!this.isBorrowValueEnough(borrow.borrowValue)) {
        break;
      }

      const repayAmount = this.calculateRepayAmount(borrow, collateral);

      if (repayAmount <= 0n) {
        break;
      }

      const borrowMarket = this.storageService.getMarket(borrow.address);
      const collateralMarket = this.storageService.getMarket(
        collateral.address,
      );

      const { liquidationData: data, biggestBorrow } =
        this.txData.get(symbolHash)!;

      const path = this.getPath(
        borrowMarket.underlyingSymbol,
        collateralMarket.underlyingSymbol,
      );

      if (!path) {
        console.error(
          `Path not found for borrow market ${borrowMarket.underlyingSymbol} and collateral market ${collateralMarket.underlyingSymbol}`,
        );
        const parts = [
          'Path not found for liquidation:',
          `_borrower: ${account.address}`,
          `_cMarket: ${borrow.address}`,
          `_cMarketCollateral: ${collateral.address}`,
          `_repayAmount: ${repayAmount}`,
          `_repayToken: ${borrowMarket.underlyingSymbol} ${borrowMarket.underlyingAddress}`,
          '----------------------',
          'Additional:',
          `repayValue: $${Number(borrow.borrowValue / BigInt(1e18)) / 2}`,
          `collateralToken: ${collateralMarket.underlyingSymbol} ${collateralMarket.underlyingAddress}`,
        ];

        // this.telegramService.construcAndSendMessage(parts);
        account.tokens[collateral.address] = 0n; // We mark this collateral as zero to avoid infinite loop and search for another one
        continue;
      }

      if (borrow.borrowValue > biggestBorrow.value) {
        biggestBorrow.value = borrow.borrowValue;
        biggestBorrow.index = data._repayTokens.length;
      }

      data._path.push(path);
      data._cMarkets.push(borrow.address);
      data._borrowers.push(account.address);
      data._repayAmounts.push(repayAmount.toString());
      data._cMarketCollaterals.push(collateral.address);
      data._repayTokens.push(
        borrowMarket.symbol === 'cETH'
          ? WETH_ADDRESS
          : borrowMarket.underlyingAddress,
      );

      const seizeTokens = this.calculateSeizeTokens(
        borrow.address,
        collateral.address,
        repayAmount,
      );

      account.tokens[collateral.address] -= seizeTokens;
      findAsset(account, borrow.address).principal -= repayAmount;

      liquidity = this.calculateAccountLiquidity(account)[0];
    }
  }

  calculateAccountLiquidity(account: AccountEntity) {
    // console.debug('method -> liquidatorService.calculateAccountLiquidity');

    const { assets, tokens } = account;
    // console.log('assets', assets);
    // console.log('tokens', Object.keys(tokens));
    let sumCollateral = 0n;
    let sumBorrow = 0n;

    for (const asset of assets) {
      const { address, principal } = asset;
      const balance = tokens[address];

      const {
        borrowIndex,
        exchangeRateMantissa,
        collateralFactorMantissa,
        underlyingPriceMantissa: _underlyingPriceMantissa,
        pendingUnderlyingPriceMantissa,
      } = this.storageService.getMarket(address);

      const underlyingPriceMantissa =
        pendingUnderlyingPriceMantissa || _underlyingPriceMantissa;

      if (balance > 0n) {
        const tokensToDenomMantissa = mul_Mantissa(
          mul_Mantissa(collateralFactorMantissa, exchangeRateMantissa),
          underlyingPriceMantissa,
        );

        sumCollateral = mulScalarTruncateAddUInt(
          tokensToDenomMantissa,
          balance,
          sumCollateral,
        );
      }

      if (principal > 0n) {
        const borrowBalance = this.accountService.borrowBalance(
          asset,
          borrowIndex,
        );

        sumBorrow = mulScalarTruncateAddUInt(
          underlyingPriceMantissa,
          borrowBalance,
          sumBorrow,
        );
      }
    }

    return sumCollateral > sumBorrow
      ? [sumCollateral - sumBorrow, 0n]
      : [0n, sumBorrow - sumCollateral];
  }

  findBorrowToLiquidate(account: AccountEntity) {
    // console.log('method -> liquidatorService.findBorrowToLiquidate');
    const assets = account.assets;

    let address = '';
    let borrowValue = 0n;

    for (const asset of assets) {
      const { principal, address: _address } = asset;

      const {
        borrowIndex,
        underlyingPriceMantissa: _underlyingPriceMantissa,
        pendingUnderlyingPriceMantissa,
      } = this.storageService.getMarket(_address);
      const underlyingPriceMantissa =
        pendingUnderlyingPriceMantissa || _underlyingPriceMantissa;

      if (!AllowedBorrowMarkets.includes(_address) || principal === 0n) {
        continue;
      }

      const borrowBalance = this.accountService.borrowBalance(
        asset,
        borrowIndex,
      );

      const _borrowValue = mul_Mantissa(underlyingPriceMantissa, borrowBalance);

      if (_borrowValue > borrowValue) {
        address = _address;
        borrowValue = _borrowValue;
      }
    }

    return {
      address,
      borrowValue,
    };
  }

  findCollateralToLiquidate(account: AccountEntity) {
    // console.log('method -> liquidatorService.findCollateralToLiquidate');

    // console.log('account', account);
    const tokens = Object.entries(account.tokens);

    let address = '';
    let collateralValue = 0n;

    for (const [_address, balance] of tokens) {
      if (balance === 0n) {
        continue;
      }

      if (_address === CSaiSymbolHash) {
        continue;
      }

      const {
        exchangeRateMantissa,
        underlyingPriceMantissa: _underlyingPriceMantissa,
        pendingUnderlyingPriceMantissa,
      } = this.storageService.getMarket(_address);

      const underlyingPriceMantissa =
        pendingUnderlyingPriceMantissa || _underlyingPriceMantissa;

      // const { liquidationIncentiveMantissa } =
      //   this.storageService.getComptroller();

      const ratio = mul_Mantissa(underlyingPriceMantissa, exchangeRateMantissa);

      const tokenValue = mul_Mantissa(ratio, balance);

      // const tokenValue = div_MantissaB(
      //   mul_Mantissa(ratio, balance),
      //   liquidationIncentiveMantissa!,
      // );

      if (tokenValue > collateralValue) {
        address = _address;
        collateralValue = tokenValue;
      }
    }

    return {
      address,
      collateralValue,
    };
  }

  calculateRepayAmount(
    borrowAsset: { address: string; borrowValue: bigint },
    collateral: { address: string; collateralValue: bigint },
  ) {
    // console.log('method -> liquidatorService.calculateRepayAmount');
    const { closeFactorMantissa } = this.storageService.getComptroller();
    const borrowMarket = this.storageService.getMarket(borrowAsset.address);
    const priceBorrowedMantissa =
      borrowMarket.pendingUnderlyingPriceMantissa ||
      borrowMarket.underlyingPriceMantissa;

    const { collateralValue } = collateral;
    // console.log('collateralValue', collateralValue);
    const { borrowValue } = borrowAsset;

    const maxRepayValue = mul_Mantissa(borrowValue, closeFactorMantissa);

    const repayValue =
      collateralValue <= maxRepayValue ? collateralValue : maxRepayValue;

    const repayAmount = div_MantissaB(repayValue, priceBorrowedMantissa);
    return repayAmount - 10000n; // Take 10000 wei less to avoid rounding errors
  }

  calculateSeizeTokens(
    cTokenBorrowed: string,
    cTokenCollateral: string,
    actualRepayAmount: bigint,
  ) {
    const borrowMarket = this.storageService.getMarket(cTokenBorrowed);
    const collateralMarket = this.storageService.getMarket(cTokenCollateral);

    const priceBorrowedMantissa =
      borrowMarket.pendingUnderlyingPriceMantissa ||
      borrowMarket.underlyingPriceMantissa;

    const priceCollateralMantissa =
      collateralMarket.pendingUnderlyingPriceMantissa ||
      collateralMarket.underlyingPriceMantissa;

    const liquidationIncentiveMantissa =
      this.storageService.getComptroller().liquidationIncentiveMantissa!;

    const exchangeRateCollateralMantissa =
      collateralMarket.exchangeRateMantissa;

    const numerator = mul_Mantissa(
      liquidationIncentiveMantissa,
      priceBorrowedMantissa,
    );

    const denominator = mul_Mantissa(
      priceCollateralMantissa,
      exchangeRateCollateralMantissa,
    );

    const ratio = div_MantissaB(numerator, denominator);

    const seizeTokens = mul_Mantissa(ratio, actualRepayAmount);

    return seizeTokens;
  }

  getPath(borrowSymbol: string, collateralSymbol: string) {
    const key = `${borrowSymbol}-${collateralSymbol}` as keyof typeof Path;
    return Path[key];
  }

  isBorrowValueEnough(borrowValue: bigint) {
    // max close value more than minimum liquidation value
    return (
      borrowValue / 2n / BigInt(1e18) >= BigInt(Env.MINIMUM_LIQUIDATION_VALUE)
    );
  }

  isCollateralValueEnough(
    collateralValue: bigint,
    liquidationIncentiveMantissa: bigint,
  ) {
    return (
      collateralValue >=
      mul_Mantissa(
        BigInt((Env.MINIMUM_LIQUIDATION_VALUE / 2) * 1e18),
        liquidationIncentiveMantissa,
      )
    );
  }
}
