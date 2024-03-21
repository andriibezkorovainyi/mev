import CErc20 from '../../../../common/compound-protocol/artifacts/CErc20.sol/CErc20.json';
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
import type { AggregatorService } from '../aggregator/aggregator.service.ts';
import { PriceSource } from '../price-oracle/price-oracle.constants.ts';

export class ComptrollerService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly accountService: AccountService,
    private readonly priceOracleService: PriceOracleService,
    private readonly aggregatorService: AggregatorService,
  ) {
    super();
  }

  async processLogs(logs) {
    //
    console.debug('method -> comptrollerService.processComptrollerLogs');

    for (const log of logs) {
      switch (log.eventName) {
        case CompEventName.MarketListed:
          await this.marketListed(log);
          break;
        case CompEventName.NewPriceOracle:
          this.newPriceOracle(log);
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

  newPriceOracle(log) {
    console.debug('method -> comptrollerService.newPriceOracle');

    const newPriceOracle = CompEventToOutputMap[CompEventName.NewPriceOracle];

    const comptroller = this.storageService.getComptroller();

    comptroller.priceOracle = log[newPriceOracle];
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

    const newMarket = await this.createMarket(cToken);

    this.storageService.setMarket(cToken, newMarket);
  }

  async createMarket(cToken: string): Promise<MarketEntity> {
    console.debug('method -> comptrollerService.createMarket');

    const newMarket = {
      address: cToken,
      accounts: new Set<string>(),
      borrowIndex: BigInt(1e18),
      underlyingPriceMantissa: 0n,
      totalCash: 0n,
      totalBorrows: 0n,
      totalReserves: 0n,
      accrualBlockNumber: 0n,
      reserveFactorMantissa: 0n,
      closeFactorMantissa: 0n,
      collateralFactorMantissa: 0n,
      borrowRateMantissa: 0n,
      totalSupply: 0n,
    };

    const tokenConfig = await this.priceOracleService.createTokenConfig(cToken); // Получаем конфиг токена из priceOracle
    await this.aggregatorService.createAggregator(tokenConfig); // Создаем экземпляр агрегатора

    if (tokenConfig.priceSource === PriceSource.FIXED_USD) {
      newMarket.underlyingPriceMantissa =
        this.priceOracleService.getUnderlyingPrice(tokenConfig);
    }

    const cTokenData = Object.values(CTokens).find(
      ({ address }) => address.toLowerCase() === cToken.toLowerCase(),
    );
    const underlyingData = Object.values(Tokens).find(
      ({ address }) =>
        address.toLowerCase() === cTokenData?.underlying.toLowerCase(),
    );

    if (!cTokenData || !underlyingData) {
      return Object.assign(newMarket, await this.fetchMarketConstants(cToken));
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

  async getCurrentInterestRateModel(market: string) {
    console.debug('method -> comptrollerService.getCurrentInterestRateModel');

    const { abi } = CErc20;

    const interestRateModelAbiItem = getAbiItem(
      abi,
      'function',
      'interestRateModel',
    );
    const interestRateModel = await this.web3Service.callContractMethod({
      abi: interestRateModelAbiItem,
      address: market,
    });

    if (!interestRateModel) throw new Error("Couldn't get interestRateModel");

    return interestRateModel;
  }

  async fetchMarketConstants(cToken: string) {
    console.debug('method -> comptrollerService.fetchMarketConstants');
    const { abi } = CErc20;

    const symbolAbiItem = getAbiItem(abi, 'function', 'symbol');
    const decimalsAbiItem = getAbiItem(abi, 'function', 'decimals');
    const underlyingAbiItem = getAbiItem(abi, 'function', 'underlying');

    const underlyingAddress: string = await this.web3Service.callContractMethod(
      {
        abi: underlyingAbiItem,
        address: cToken,
      },
    );

    if (!underlyingAddress) throw new Error("Couldn't get underlyingAddress");

    const symbol: string = (await this.web3Service.callContractMethod({
      abi: symbolAbiItem,
      address: cToken,
    }))!;

    if (!symbol) throw new Error("Couldn't get symbol");

    const decimals: number = Number(
      await this.web3Service.callContractMethod({
        abi: decimalsAbiItem,
        address: cToken,
      }),
    );

    if (!decimals) throw new Error("Couldn't get decimals");

    const underlyingDecimals: number = Number(
      await this.web3Service.callContractMethod({
        abi: decimalsAbiItem,
        address: underlyingAddress,
      }),
    );
    if (!underlyingDecimals) throw new Error("Couldn't get underlyingDecimals");

    const underlyingSymbol = await this.web3Service.callContractMethod({
      abi: symbolAbiItem,
      address: underlyingAddress,
    });
    if (!underlyingSymbol)
      throw new Error(`Couldn't get underlyingSymbol for ${underlyingAddress}`);

    // const interestRateModel = await this.getCurrentInterestRateModel(cToken);

    return {
      underlyingSymbol,
      underlyingAddress,
      symbol: symbol as string,
      decimals,
      underlyingDecimals,
      exchangeRateMantissa: 0n,
      // interestRateModel,
    };
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> collectComptrollerLogs');

    const address = [this.env.COMPTROLLER_PROXY_ADDRESS];

    const eventNames = Object.values(CompEventName);
    const abi = filterAbi(Comptroller.abi, eventNames);

    const logs = await this.web3Service.getFilteredLogsByPieces(
      address,
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    let decodedLogs = this.web3Service.decodeLogs(logs, abi);

    decodedLogs = sortLogs(decodedLogs);

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
      address: this.env.COMPTROLLER_PROXY_ADDRESS,
      args: [address],
      blockNumber,
    });

    if (!accountLiquidity) throw new Error("Couldn't get accountLiquidity");

    return accountLiquidity;
  }

  async fetchAllMarkets() {
    console.debug('method -> comptrollerService.fetchAllMarkets');

    const { abi } = Comptroller;
    const getAllMarketsAbiItem = getAbiItem(abi, 'function', 'getAllMarkets');

    const allMarkets = await this.web3Service.callContractMethod({
      abi: getAllMarketsAbiItem,
      address: this.env.COMPTROLLER_PROXY_ADDRESS,
      args: [],
    });

    if (!allMarkets) throw new Error("Couldn't get allMarkets");

    return allMarkets;
  }
}
