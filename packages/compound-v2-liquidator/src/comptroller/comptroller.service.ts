import CTokens from '../../artifacts/network/CTokens.json';
import Tokens from '../../artifacts/network/Tokens.json';
import Comptroller from '../../../../common/compound-protocol/artifacts/Comptroller.sol/Comptroller.json';
import type { StorageService } from '../storage/storage.service.ts';
import { toBigInt } from 'ethers';
import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import {
  CompEventName,
  CompEventToOutputMap,
} from './comptroller.constants.ts';
import type { MarketEntity } from '../market/market.entity.ts';
import {
  filterAbi,
  getAbiItem,
  sortLogs,
} from '../../utils/helpers/array.helpers.ts';
import type { AccountService } from '../account/account.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import Env from '../../utils/constants/env.ts';
import type { IDecodedLog } from '../../utils/interfaces/decoded-log.interface.ts';
import type { MarketService } from '../market/market.service.ts';
import type { WorkerService } from '../worker/worker.service.ts';

export class ComptrollerService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly marketService: MarketService,
    private readonly accountService: AccountService,
    private readonly priceOracleService: PriceOracleService,
    private readonly workerService: WorkerService,
  ) {
    super();
  }

  async processLogs(logs: IDecodedLog[]) {
    //
    console.debug('method -> comptrollerService.processComptrollerLogs');

    for (const log of logs) {
      switch (log.eventName) {
        case CompEventName.MarketListed:
          await this.marketListed(log);
          break;
        case CompEventName.NewPriceOracle:
          await this.newPriceOracle(log);
          break;
        case CompEventName.MarketEntered:
          this.marketEntered(log);
          break;
        case CompEventName.MarketExited:
          this.marketExited(log);
          break;
        case CompEventName.NewCloseFactor:
          this.newCloseFactor(log);
          break;
        case CompEventName.NewCollateralFactor:
          this.newCollateralFactor(log);
          break;
        case CompEventName.NewLiquidationIncentive:
          this.newLiquidationIncentive(log);
          break;
        default:
          console.warn('Unknown event', log.eventName);
      }
    }
  }

  newCollateralFactor(log) {
    console.debug('method -> comptrollerService.newCollateralFactor');

    const [key1, key2] =
      CompEventToOutputMap[CompEventName.NewCollateralFactor].split(',');
    const cToken = log[key1];
    const newCollateralFactorMantissa = log[key2];

    const market = this.storageService.getMarket(cToken);
    market.collateralFactorMantissa = newCollateralFactorMantissa;
  }

  newCloseFactor(log) {
    console.debug('method -> comptrollerService.newCloseFactor');
    const key = CompEventToOutputMap[CompEventName.NewCloseFactor];
    const newCloseFactorMantissa = log[key];

    const comptroller = this.storageService.getComptroller();
    comptroller.closeFactorMantissa = newCloseFactorMantissa;
  }

  async newPriceOracle(log) {
    console.debug('method -> comptrollerService.newPriceOracle');

    const newPriceOracle = CompEventToOutputMap[CompEventName.NewPriceOracle];

    const comptroller = this.storageService.getComptroller();

    comptroller.priceOracle = log[newPriceOracle];

    if (log.blockNumber < Env.NORMAL_PRICE_ORACLE_START_BLOCK) {
      return;
    }

    const allMarkets = comptroller.allMarkets.values();

    const newTokenConfigs: TokenConfigEntity[] = [];

    for (const cToken of allMarkets) {
      newTokenConfigs.push(
        await this.priceOracleService.createTokenConfig(
          cToken,
          log.blockNumber,
        ),
      );

      await this.priceOracleService.fetchAndUpdateUnderlyingPrice(
        cToken,
        log.blockNumber,
      );
    }

    this.workerService.emitNewTokenConfigs(newTokenConfigs);
  }

  marketEntered(log) {
    console.debug('method -> comptrollerService.marketEntered');

    const [cTokenKey, accountKey] =
      CompEventToOutputMap[CompEventName.MarketEntered].split(',');
    const cToken = log[cTokenKey];
    const address = log[accountKey];

    const market = this.storageService.getMarket(cToken);
    if (!market) throw new Error('No market to enter found');

    market.accounts.add(address);

    // console.log('marketEntered', { cToken, address });

    const account = this.storageService.getAccount(address);

    if (account) {
      this.accountService.enterMarket(account, cToken);
    } else {
      this.accountService.createAccountWithAsset(address, cToken);
    }
  }

  marketExited(log) {
    console.debug('method -> comptrollerService.marketExited');

    const [cTokenKey, accountKey] =
      CompEventToOutputMap[CompEventName.MarketEntered].split(',');
    const cToken = log[cTokenKey];
    const address = log[accountKey];

    const market = this.storageService.getMarket(cToken);
    market.accounts.delete(address);

    const account = this.storageService.getAccount(address);

    if (account) {
      this.accountService.exitMarket(account, cToken);
    } else {
      throw new Error('Account not found');
    }
  }

  async marketListed(log) {
    console.debug('method -> comptrollerService.marketListed');
    const key = CompEventToOutputMap[CompEventName.MarketListed];
    const cToken: string = log[key];

    const comptroller = this.storageService.getComptroller();
    comptroller.allMarkets.add(cToken);

    const market = this.storageService.getMarket(cToken);

    if (market) {
      return;
    }

    const newMarket = await this.createMarket(cToken, log.blockNumber);

    this.storageService.setMarket(cToken, newMarket);
  }

  newLiquidationIncentive(log) {
    console.debug('method -> comptrollerService.newLiquidationIncentive');

    const key = CompEventToOutputMap[CompEventName.NewLiquidationIncentive];
    const newLiquidationIncentiveMantissa = log[key];

    const comptroller = this.storageService.getComptroller();
    comptroller.liquidationIncentiveMantissa = newLiquidationIncentiveMantissa;
  }

  async createMarket(
    cToken: string,
    blockNumber?: number,
  ): Promise<MarketEntity> {
    console.debug('method -> comptrollerService.createMarket');

    console.log('comptroller', this.storageService.getComptroller());
    const newMarket = {
      address: cToken,
      accounts: new Set<string>(),
      borrowIndex: BigInt(1e18),
      underlyingPriceMantissa:
        await this.priceOracleService.fetchUnderlyingPrice(cToken, blockNumber),
      accrualBlockNumber: 0n,
      reserveFactorMantissa: 0n,
      closeFactorMantissa: 0n,
      collateralFactorMantissa: 0n,
      borrowRateMantissa: 0n,
      exchangeRateLastUpdateBlock: 0,
    };

    if (blockNumber && blockNumber >= Env.NORMAL_PRICE_ORACLE_START_BLOCK) {
      await this.priceOracleService.createTokenConfig(cToken, blockNumber);
    }

    const cTokenData = Object.values(CTokens).find(
      ({ address }) => address.toLowerCase() === cToken.toLowerCase(),
    );
    const underlyingData = Object.values(Tokens).find(
      ({ address }) =>
        address.toLowerCase() === cTokenData?.underlying.toLowerCase(),
    );

    if (!cTokenData || !underlyingData) {
      return Object.assign(
        newMarket,
        await this.fetchMarketConstants(cToken, blockNumber),
      );
    } else {
      return Object.assign(
        newMarket,
        await this.createMarketFromData(cTokenData, underlyingData),
      );
    }
  }

  async createMarketFromData(cTokenData, underlyingData) {
    const {
      underlying: underlyingAddress,
      decimals,
      symbol,
      initial_exchange_rate_mantissa: exchangeRateMantissa,
    } = cTokenData;

    const { decimals: underlyingDecimals, symbol: underlyingSymbol } =
      underlyingData;

    return {
      underlyingAddress,
      decimals,
      symbol,
      exchangeRateMantissa: toBigInt(exchangeRateMantissa),
      underlyingDecimals,
      underlyingSymbol,
    };
  }

  async fetchMarketConstants(cToken: string, blockNumber?: number) {
    console.debug('method -> comptrollerService.fetchMarketConstants');

    const exchangeRateMantissa =
      await this.marketService.fetchExchangeRateMantissa(cToken, blockNumber);

    const underlyingAddress: string =
      await this.marketService.fetchUnderlingAddress(cToken, blockNumber);

    const symbol: string = await this.marketService.fetchSymbol(cToken);

    const decimals: number =
      await this.marketService.fetchDecimalsErc20(cToken);

    const underlyingDecimals: number =
      await this.marketService.fetchDecimalsErc20(underlyingAddress);

    const underlyingSymbol =
      await this.marketService.fetchSymbol(underlyingAddress);

    return {
      exchangeRateMantissa,
      underlyingAddress,
      symbol: symbol as string,
      decimals,
      underlyingDecimals,
      underlyingSymbol,
    };
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> collectComptrollerLogs');

    const address = [Env.COMPTROLLER_PROXY_ADDRESS];

    const eventNames = Object.values(CompEventName);
    const abi = filterAbi(Comptroller.abi, eventNames);

    const logs = await this.web3Service.getFilteredLogsByPieces(
      address,
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    const decodedLogs = sortLogs(this.web3Service.decodeLogs(logs, abi));

    return decodedLogs;
  }

  async fetchAccountLiquidity(address: string, blockNumber?: number) {
    console.debug('method -> comptrollerService.fetchAccountLiquidity');

    const { abi } = Comptroller;
    const getAccountLiquidityAbiItem = getAbiItem(
      abi,
      'function',
      'getAccountLiquidity',
    );

    const accountLiquidity = await this.web3Service.callContractMethod({
      abi: getAccountLiquidityAbiItem,
      address: Env.COMPTROLLER_PROXY_ADDRESS,
      args: [address],
      blockNumber,
    });

    if (!accountLiquidity) throw new Error("Couldn't get accountLiquidity");

    return accountLiquidity;
  }

  async fetchLiquidateCalculateSeizeTokens(
    cTokenBorrowed: string,
    cTokenCollateral: string,
    actualRepayAmount: bigint,
    blockNumber?: number,
  ) {
    console.debug(
      'method -> comptrollerService.fetchLiquidateCalculateSeizeTokens',
    );

    const { abi } = Comptroller;
    const calculateSeizeTokensAbiItem = getAbiItem(
      abi,
      'function',
      'liquidateCalculateSeizeTokens',
    );

    const seizeTokens = await this.web3Service.callContractMethod({
      abi: calculateSeizeTokensAbiItem,
      address: Env.COMPTROLLER_PROXY_ADDRESS,
      args: [cTokenBorrowed, cTokenCollateral, actualRepayAmount],
      blockNumber,
    });

    if (!seizeTokens) throw new Error("Couldn't get seizeTokens");

    return seizeTokens;
  }

  async fetchLiquidationIncentiveMantissa(blockNumber?: number) {
    console.debug(
      'method -> comptrollerService.fetchLiquidationIncentiveMantissa',
    );

    const { abi } = Comptroller;
    const getLiquidationIncentiveAbiItem = getAbiItem(
      abi,
      'function',
      'liquidationIncentiveMantissa',
    );

    const liquidationIncentiveMantissa =
      await this.web3Service.callContractMethod({
        abi: getLiquidationIncentiveAbiItem,
        address: Env.COMPTROLLER_PROXY_ADDRESS,
        args: [],
        blockNumber,
      });

    if (!liquidationIncentiveMantissa)
      throw new Error("Couldn't get liquidationIncentiveMantissa");

    return liquidationIncentiveMantissa;
  }

  async fetchAllMarkets() {
    console.debug('method -> comptrollerService.fetchAllMarkets');

    const { abi } = Comptroller;
    const getAllMarketsAbiItem = getAbiItem(abi, 'function', 'getAllMarkets');

    const allMarkets = await this.web3Service.callContractMethod({
      abi: getAllMarketsAbiItem,
      address: Env.COMPTROLLER_PROXY_ADDRESS,
      args: [],
    });

    if (!allMarkets) throw new Error("Couldn't get allMarkets");

    return allMarkets;
  }

  async collectActualTokenConfigs() {
    const comptroller = this.storageService.getComptroller();
    comptroller.priceOracle = '0x50ce56A3239671Ab62f185704Caedf626352741e';

    const addresses = [
      // All cTokens listed on Compound
      '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
      '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
      '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
      '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
      '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
      '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9',
      '0xC11b1268C1A384e55C48c2391d8d480264A3A7F4',
      '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
      '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
      '0x35A18000230DA775CAc24873d00Ff85BccdeD550',
      '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4',
      '0xccF4429DB6322D5C611ee964527D42E5d685DD6a',
      '0x12392F67bdf24faE0AF363c24aC620a2f67DAd86',
      '0xFAce851a4921ce59e912d19329929CE6da6EB0c7',
      '0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b',
      '0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7',
      '0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c',
      '0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946',
      '0x041171993284df560249B57358F931D9eB7b925D',
      '0x7713DD9Ca933848F6819F38B8352D9A15EA73F67',
    ];

    for (const address of addresses) {
      await this.createMarket(address, 19469068);
    }

    await this.storageService.cacheTokenConfigs();
  }
}
