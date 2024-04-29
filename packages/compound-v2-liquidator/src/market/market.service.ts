import type { AccountService } from '../account/account.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import { MarketEventName, MarketEventToOutput } from './market.constants.ts';
import CToken from '../../../../common/compound-protocol/artifacts/CToken.sol/CToken.json';
import {
  filterAbi,
  findAsset,
  getAbiItem,
  sortLogs,
} from '../../utils/helpers/array.helpers.ts';
import CErc20 from '../../../../common/compound-protocol/artifacts/CErc20.sol/CErc20.json';
import Env from '../../utils/constants/env.ts';
import type { IDecodedLog } from '../../utils/interfaces/decoded-log.interface.ts';
import type { TelegramService } from '../telegram/telegram.service.ts';
import { mul_Mantissa } from '../../utils/math/ExpNoError.ts';

export class MarketService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly accountService: AccountService,
    private readonly telegramService: TelegramService,
  ) {
    super();
  }

  async processLogs(logs: IDecodedLog[]) {
    for (const log of logs) {
      switch (log.eventName) {
        case MarketEventName.AccrueInterest:
          await this.accrueInterest(log);
          break;
        case MarketEventName.Transfer:
          await this.transfer(log);
          break;
        case MarketEventName.Borrow:
          await this.borrow(log);
          break;
        case MarketEventName.RepayBorrow:
          await this.repayBorrow(log);
          break;
        case MarketEventName.ReservesAdded:
          await this.reservesAdded(log);
          break;
        case MarketEventName.ReservesReduced:
          await this.reservesReduced(log);
          break;
        case MarketEventName.NewReserveFactor:
          this.newReserveFactor(log);
          break;
        default:
          break;
        case MarketEventName.LiquidateBorrow:
          await this.liquidateBorrow(log);
          break;
        // case MarketEventName.Mint:
        //   await this.mint(log);
        //   break;
        // case MarketEventName.Redeem:
        //   await this.redeem(log);
        //   break;
      }
    }
  }

  async accrueInterest(log) {
    console.debug('function -> accrueInterest');

    const [key1, key2, key3, key4] =
      MarketEventToOutput[MarketEventName.AccrueInterest].split(',');

    // const interestAccumulated: bigint = log[key1]; // можно высчитать borrowRate;
    const borrowIndex: bigint = log[key2];
    // const totalBorrows: bigint = log[key3];
    // const cashPrior: bigint | undefined = log[key4];

    const market = this.storageService.getMarket(log.address);
    // console.log('before market', market);

    market.borrowIndex = borrowIndex;

    market.accrualBlockNumber = BigInt(log.blockNumber);

    await this.fetchAndUpdateExchangeRate(log.address, log.blockNumber);

    // try {
    //   const [actualTotalReserves, totalCash] = await Promise.all([
    //     this.fetchMarketTotalReserves(log.address, log.blockNumber),
    //     this.fetchMarketTotalCash(log.address, log.blockNumber),
    //   ]);
    //   market.totalReserves = actualTotalReserves;
    //   console.log('after market', market);
    // } catch (e) {
    //   console.error(e);
    // }
  }

  private async transfer(log) {
    console.debug('function -> transfer');
    const [key1, key2, key3] =
      MarketEventToOutput[MarketEventName.Transfer].split(',');

    const from = log[key1];
    const to = log[key2];
    const amount = log[key3]; // cTokens
    const cToken = log.address;

    const accountFrom = this.storageService.getAccount(from);
    const marketFrom = this.storageService.getMarket(from);
    const accountTo = this.storageService.getAccount(to);
    const marketTo = this.storageService.getMarket(to);

    // if (marketFrom || marketTo) {
    //   return;
    // }

    if (marketFrom) {
      // skip
    } else if (accountFrom) {
      await this.accountService.defundAccountBalance(
        accountFrom,
        cToken,
        amount,
        log,
      );
    }

    if (marketTo) {
      // skip
    } else if (accountTo) {
      this.accountService.fundAccountTokens(accountTo, cToken, amount);
    } else {
      this.accountService.createAccountWithToken(to, cToken, amount);
    }

    await this.fetchAndUpdateExchangeRate(cToken, log.blockNumber);
  }

  async updateUnderlyingPrice(
    cToken: string,
    newPriceMantissa: bigint,
    blockNumber: number,
  ) {
    const market = this.storageService.getMarket(cToken);
    if (!market) {
      throw new Error('Market not found\n' + `marketAddress: ${cToken}`);
    }

    market.underlyingPriceMantissa = newPriceMantissa;

    await this.fetchAndUpdateExchangeRate(cToken, blockNumber);
  }

  async fetchAndUpdateExchangeRate(cToken: string, blockNumber: number) {
    console.debug('method -> updateExchangeRate');
    const market = this.storageService.getMarket(cToken);

    if (
      Env.SHOULD_FETCH_EXCHANGE_RATES &&
      blockNumber >= Env.NORMAL_PRICE_ORACLE_START_BLOCK &&
      blockNumber > market.exchangeRateLastUpdateBlock
    ) {
      market.exchangeRateMantissa = await this.fetchExchangeRateMantissa(
        cToken,
        blockNumber,
      );
      market.exchangeRateLastUpdateBlock = blockNumber;
    } else {
      console.debug('Exchange rate not updated');
    }
  }

  // async mint(log) {
  //   console.debug('function -> mint');
  //   const [key1, key2, key3] =
  //     MarketEventToOutput[MarketEventName.Mint].split(',');
  //
  //   const minter = log[key1];
  //   const mintTokens = log[key3];
  //
  //   const account = this.storageService.getAccount(minter);
  //
  //   if (account) {
  //     this.accountService.fundAccountTokens(account, log.address, mintTokens);
  //   } else {
  //     this.accountService.createAccountWithToken(
  //       minter,
  //       log.address,
  //       mintTokens,
  //     );
  //   }
  //
  //   await this.fetchAndUpdateExchangeRate(log.address, log.blockNumber);
  // }

  // private async redeem(log) {
  //   console.debug('function -> redeem');
  //
  //   const [key1, key2, key3] =
  //     MarketEventToOutput[MarketEventName.Redeem].split(',');
  //
  //   const cToken = log.address;
  //   const redeemer = log[key3];
  //   // const redeemAmount = log[key1];
  //   const redeemTokens = log[key2];
  //   // const market = this.storageService.getMarket(log.address);
  //
  //   const account = this.storageService.getAccount(redeemer);
  //
  //   if (!account) {
  //     return;
  //   }
  //
  //   // market.totalCash -= redeemAmount;
  //   // market.totalSupply -= redeemTokens;
  //
  //   await this.accountService.defundAccountBalance(
  //     account,
  //     cToken,
  //     redeemTokens,
  //     log.blockNumber,
  //   );
  //
  //   await this.fetchAndUpdateExchangeRate(cToken, log.blockNumber);
  // }

  private newReserveFactor(log) {
    console.debug('function -> newReserveFactor');
    const key = MarketEventToOutput[MarketEventName.NewReserveFactor];
    const newReserveFactorMantissa = log[key];
    const market = this.storageService.getMarket(log.address);
    market.reserveFactorMantissa = newReserveFactorMantissa;
  }

  private async liquidateBorrow(log: IDecodedLog) {
    console.debug('function -> liquidateBorrow');
    const [key1, key2, key3, key4, key5] =
      MarketEventToOutput[MarketEventName.LiquidateBorrow].split(',');

    const liquidator = log[key1];
    const borrower = log[key2];
    const repayAmount = log[key3];
    const cTokenCollateral = log[key4];
    const seizeTokens = log[key5];
    const blockNumber = log.blockNumber;
    const txIndex = log.transactionIndex;

    if (!Env.SHOULD_EMIT_LIQUIDATION_EVENTS) {
      return;
    }

    const txHash = (
      await this.web3Service.getTrasactionByBlockAndIndex(blockNumber, txIndex)
    )?.hash;
    const marketLiquidated = this.storageService.getMarket(log.address);
    const marketCollateral = this.storageService.getMarket(cTokenCollateral);

    const repayValue = Number(
      mul_Mantissa(repayAmount, marketLiquidated.underlyingPriceMantissa) /
        BigInt(1e18),
    );
    // const seizeValue = Number(
    //   mul_Mantissa(
    //     mul_Mantissa(
    //       marketLiquidated.underlyingPriceMantissa,
    //       marketLiquidated.exchangeRateMantissa,
    //     ),
    //     seizeTokens,
    //   ) / BigInt(1e18),
    // );

    const messageParts = [
      '---------------------',
      `liquidator: ${liquidator}`,
      `borrower: ${borrower}`,
      `market: ${marketLiquidated.symbol} ${marketLiquidated.address}`,
      `repayAmount: ${marketLiquidated.underlyingSymbol} ${Number(repayAmount) / 10 ** marketLiquidated.underlyingDecimals} ${marketLiquidated.underlyingSymbol}`,
      `collateral: ${marketCollateral.symbol} ${marketCollateral.address}`,
      '---------------------',
      'Additional:',
      `txHash: ${txHash}`,
      `repayValue: $${repayValue}`,
      // `revenue: $${seizeValue - repayValue}`,
      `blockNumber: ${blockNumber}`,
    ];

    await this.sendNewLiquidationMessage(messageParts);
  }

  async sendNewLiquidationMessage(args: string[]) {
    const bundlePrefix = 'New Liquidation event:';
    args.unshift(bundlePrefix);
    const message = args.join('\n');

    await this.telegramService.sendMessage(message);
  }

  private async borrow(log) {
    console.debug('function -> borrow');

    const [key1, key2, key3, key4] =
      MarketEventToOutput[MarketEventName.Borrow].split(',');

    const cToken = log.address;
    const borrower = log[key1];
    // const amount = log[key2];
    const accountBorrows = log[key3];
    // const totalBorrows = log[key4];

    const market = this.storageService.getMarket(cToken);

    const account = this.storageService.getAccount(borrower);

    if (!account) {
      throw new Error('Account not found');
    }

    await this.fetchAndUpdateExchangeRate(cToken, log.blockNumber);

    this.accountService.addBorrows(
      account,
      cToken,
      accountBorrows,
      market.borrowIndex,
    );
  }

  private async repayBorrow(log) {
    console.debug('function -> repayBorrow');
    const [key1, key2, key3, key4, key5] =
      MarketEventToOutput[MarketEventName.RepayBorrow].split(',');

    const borrower = log[key2];
    // const repayAmount = log[key3];
    const accountBorrows = log[key4];
    // const totalBorrowsNew = log[key5];
    const cToken = log.address;

    const market = this.storageService.getMarket(cToken);
    const account = this.storageService.getAccount(borrower);
    // console.log(
    //   'account',
    //   account,
    //   'cToken',
    //   cToken,
    //   'repayAmount',
    //   repayAmount,
    //   'accountBorrows',
    //   accountBorrows,
    // );

    if (!account) {
      return;
    }
    const asset = findAsset(account, cToken);

    if (!asset) {
      return;
    }

    asset.principal = accountBorrows;
    asset.interestIndex = market.borrowIndex;

    await this.fetchAndUpdateExchangeRate(cToken, log.blockNumber);
  }

  private async reservesAdded(log) {
    console.debug('function -> reservesAdded');

    // const [key1, key2] =
    //   MarketEventToOutput[MarketEventName.ReservesAdded].split(',');

    await this.fetchAndUpdateExchangeRate(log.address, log.blockNumber);
  }

  private async reservesReduced(log) {
    console.debug('function -> reservesReduced');

    await this.fetchAndUpdateExchangeRate(log.address, log.blockNumber);
  }

  fetchBorrowRateMantissa(cToken: string) {
    const { abi } = CToken;
    const borrowRateMantissaItem = getAbiItem(
      abi,
      'function',
      'borrowRatePerBlock',
    );
    return this.web3Service.callContractMethod({
      address: cToken,
      abi: borrowRateMantissaItem,
    });
  }

  async fetchMarketTotalReserves(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const totalReservesItem = getAbiItem(abi, 'function', 'totalReserves');
    const totalReserves = await this.web3Service.callContractMethod({
      address: cToken,
      abi: totalReservesItem,
      blockNumber,
    });

    if (totalReserves === undefined) {
      throw new Error('Total reserves not found');
    }

    return totalReserves;
  }

  async fetchMarketTotalBorrows(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const totalBorrowsItem = getAbiItem(abi, 'function', 'totalBorrows');
    const totalBorrows = await this.web3Service.callContractMethod({
      address: cToken,
      abi: totalBorrowsItem,
      blockNumber,
    });

    if (totalBorrows === undefined) {
      throw new Error('Total borrows not found');
    }

    return totalBorrows;
  }

  async fetchMarketBorrowIndex(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const borrowIndexItem = getAbiItem(abi, 'function', 'borrowIndex');
    const borrowIndex = await this.web3Service.callContractMethod({
      address: cToken,
      abi: borrowIndexItem,
      blockNumber,
    });

    if (borrowIndex === undefined) {
      throw new Error('Borrow index not found');
    }

    return borrowIndex;
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> collectMarketsLogs');

    const comptroller = this.storageService.getComptroller()!;
    const addresses = Array.from(comptroller.allMarkets);

    if (addresses.length === 0) {
      return [];
    }

    const eventNames = Object.values(MarketEventName);
    const abi = filterAbi(CErc20.abi, eventNames);

    const logs = await this.web3Service.getFilteredLogsByPieces(
      addresses,
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    const decodedLogs = sortLogs(this.web3Service.decodeLogs(logs, abi));

    return decodedLogs;
  }

  async fetchBalanceOf(tokenAddress: string, account: string) {
    const { abi } = CErc20;
    const balanceOfItem = getAbiItem(abi, 'function', 'balanceOf');
    const balance = await this.web3Service.callContractMethod({
      address: tokenAddress,
      abi: balanceOfItem,
      args: [account],
    });

    if (balance === undefined) {
      throw new Error('Balance not found');
    }

    return balance;
  }

  async fetchExchangeRateMantissa(cToken: string, blockNumber?: number) {
    console.debug('method -> fetchExchangeRateMantissa');
    const { abi } = CToken;
    const exchangeRateItem = getAbiItem(abi, 'function', 'exchangeRateStored');
    const exchangeRate = await this.web3Service.callContractMethod({
      address: cToken,
      abi: exchangeRateItem,
      blockNumber,
    });

    if (exchangeRate === undefined) {
      throw new Error('Exchange rate not found');
    }

    return exchangeRate;
  }

  async executeBorrow({ address, from, privateKey, amount }) {
    const abi = CErc20.abi.find((a) => a.name === 'borrow');

    const receipt = await this.web3Service.executeContractMethod({
      address,
      abi,
      from,
      privateKey,
      args: [amount],
    });

    return receipt;
  }

  async executeMint({ address, from, privateKey, amount }) {
    const abi = CErc20.abi.find((a) => a.name === 'mint');

    const receipt = await this.web3Service.executeContractMethod({
      address,
      abi,
      from,
      privateKey,
      args: [amount],
    });

    return receipt;
  }

  async fetchCollateralFactor(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const collateralFactorItem = getAbiItem(
      abi,
      'function',
      'collateralFactorMantissa',
    );
    const collateralFactor = await this.web3Service.callContractMethod({
      address: cToken,
      abi: collateralFactorItem,
      blockNumber,
    });

    if (collateralFactor === undefined) {
      throw new Error('Collateral factor not found');
    }

    return collateralFactor;
  }

  async fetchUnderlingAddress(cToken: string, blockNumber?: number) {
    const underlyingAbiItem = getAbiItem(CErc20.abi, 'function', 'underlying');

    const underlyingAddress = await this.web3Service.callContractMethod({
      abi: underlyingAbiItem,
      address: cToken,
      blockNumber,
    });

    if (!underlyingAddress) throw new Error("Couldn't get underlyingAddress");

    return underlyingAddress;
  }

  async fetchSymbol(cToken: string, blockNumber?: number) {
    const symbolAbiItem = getAbiItem(CErc20.abi, 'function', 'symbol');

    const symbol = await this.web3Service.callContractMethod({
      abi: symbolAbiItem,
      address: cToken,
    });

    if (!symbol) throw new Error("Couldn't get symbol");

    return symbol;
  }

  async fetchDecimalsErc20(cToken: string, blockNumber?: number) {
    const decimalsAbiItem = getAbiItem(CErc20.abi, 'function', 'decimals');

    const decimals: number = Number(
      await this.web3Service.callContractMethod({
        abi: decimalsAbiItem,
        address: cToken,
      }),
    );

    if (Number.isNaN(decimals)) throw new Error("Couldn't get decimals");

    return decimals;
  }

  // async fetchMarketTotalCash(cToken: string, blockNumber?: number) {
  //   const { abi } = CToken;
  //   // const balanceOfAbiItem = getAbiItem(abi, 'function', 'balanceOf');
  //   const totalCashItem = getAbiItem(abi, 'function', 'getCash');
  //   const totalCash = await this.web3Service.callContractMethod({
  //     address: cToken,
  //     abi: balanceOfAbiItem,
  //     blockNumber,
  //   });
  //
  //   if (totalCash === undefined) {
  //     throw new Error('Total cash not found');
  //   }
  //
  //   return totalCash;
  // }
}
