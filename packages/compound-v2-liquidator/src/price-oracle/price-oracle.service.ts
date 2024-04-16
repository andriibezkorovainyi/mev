import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import UniswapAnchoredViewAbi from '../../../../common/uniswap/artifacts/UniswapAnchoredView.sol/UniswapAnchoredView.json';
import {
  filterAbi,
  getAbiItem,
  sortLogs,
} from '../../utils/helpers/array.helpers.ts';
import {
  PriceOracleEventName,
  PriceOracleEventToOutput,
  PriceSource,
} from './price-oracle.constants.ts';
import type { TokenConfigEntity } from './token-config.entity.ts';
import { mulDiv } from '../../utils/math/FullMath.ts';
import { EthSymbolHash } from '../mempool/mempool.constants.ts';
import type { ValidatorProxyService } from '../validator-proxy/validator-proxy.service.ts';
import type { IDecodedLog } from '../../utils/interfaces/decoded-log.interface.ts';
import type { MarketService } from '../market/market.service.ts';
import { delay } from '../../../../common/helpers/delay.ts';
import Env from '../../utils/constants/env.ts';

export class PriceOracleService extends Service {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly storageService: StorageService,
    private readonly validatorProxyService: ValidatorProxyService,
    private readonly marketService: MarketService,
  ) {
    super();
  }

  async processLogs(logs: IDecodedLog[]) {
    console.debug('method -> processLogs');

    for (const log of logs) {
      switch (log.eventName) {
        case PriceOracleEventName.PriceUpdated:
          await this.priceUpdated(log);
          break;
        case PriceOracleEventName.PriceGuarded:
          await this.priceGuarded(log);
          break;
        case PriceOracleEventName.FailoverActivated:
          console.log('FailoverActivated');
          break;
        case PriceOracleEventName.FailoverDeactivated:
          console.log('FailoverDeactivated');
          break;
        case PriceOracleEventName.PricePosted:
          this.pricePosted(log);
          break;
        default:
          console.warn('Unknown event', log.eventName);
      }
    }
  }

  async priceGuarded(log: IDecodedLog) {
    console.debug('method -> priceOracleService.priceGuarded');
    const [key1, key2] =
      PriceOracleEventToOutput[PriceOracleEventName.PriceGuarded].split(',');

    const symbolHash = log[key1];
    const anchorPrice = log[key2];

    const tokenConfigs =
      this.storageService.getTokenConfigsBySymbolHash(symbolHash);

    if (!tokenConfigs.length) {
      console.log('Token configs not found');
      return;
    }

    const underlyingPriceMantissa = await this.fetchUnderlyingPrice(
      tokenConfigs[0].marketAddress,
      log.blockNumber,
    );

    for (const tokenConfig of tokenConfigs) {
      console.log('new anchor price', anchorPrice);

      tokenConfig.price = anchorPrice;

      await this.updateUnderlyingPrice(
        tokenConfig,
        underlyingPriceMantissa,
        log.blockNumber,
      );
    }
  }

  private pricePosted(log: IDecodedLog) {
    console.debug('method -> priceOracleService.pricePosted');
    const [key1, key2] =
      PriceOracleEventToOutput[PriceOracleEventName.PricePosted].split(',');

    const asset = log[key1];
    const newPriceMantissa = log[key2];

    const markets = this.storageService.getMarkets();
    const market = Object.values(markets).find(
      (m) => m.underlyingAddress === asset,
    );

    if (!market) {
      throw new Error('Market not found\n' + `asset: ${asset}`);
    }
    market.underlyingPriceMantissa = newPriceMantissa;
  }

  async priceUpdated(log) {
    console.debug('method -> priceOracleService.priceUpdated');
    const [key1, key2] =
      PriceOracleEventToOutput[PriceOracleEventName.PriceUpdated].split(',');

    const symbolHash = log[key1];
    console.log('symbolHash', symbolHash);
    const price = log[key2];

    const tokenConfigs =
      this.storageService.getTokenConfigsBySymbolHash(symbolHash);

    if (!tokenConfigs.length) {
      console.log('Token configs not found');
      return;
    }

    const underlyingPriceMantissa = await this.fetchUnderlyingPrice(
      tokenConfigs[0].marketAddress,
      log.blockNumber,
    );

    for (const tokenConfig of tokenConfigs) {
      console.log('new underlying price', underlyingPriceMantissa);

      tokenConfig.price = price;

      await this.updateUnderlyingPrice(
        tokenConfig,
        underlyingPriceMantissa,
        log.blockNumber,
      );
    }
  }

  async updateUnderlyingPrice(
    tokenConfig: TokenConfigEntity,
    underlyingPriceMantissa: bigint,
    blockNumber: number,
  ) {
    const { symbolHash, marketAddress } = tokenConfig;

    await this.marketService.updateUnderlyingPrice(
      marketAddress,
      underlyingPriceMantissa,
      blockNumber,
    );

    if (symbolHash === EthSymbolHash) {
      await this.updateEthFixedPriceMarkets(blockNumber);
    }
  }

  async updateEthFixedPriceMarkets(blockNumber: number) {
    console.log('method -> priceOracleService.updateEthFixedPriceMarkets');

    const ethFixedPriceTokenConfigs =
      this.storageService.getTokenConfigsByPriceSource(PriceSource.FIXED_ETH);

    for (const config of ethFixedPriceTokenConfigs) {
      console.log('market address', config.marketAddress);

      const underlyingPrice = this.getUnderlyingPrice(config);
      // const underlyingPrice = await this.fetchUnderlyingPrice(
      //   config.marketAddress,
      //   blockNumber,
      // );

      await this.marketService.updateUnderlyingPrice(
        config.marketAddress,
        underlyingPrice,
        blockNumber,
      );

      await delay(500);
    }
  }

  async collectLogs(
    fromBlock: number,
    toBlock: number,
  ): Promise<IDecodedLog[]> {
    console.debug('method -> priceOracleService.collectLogs');

    const comptroller = this.storageService.getComptroller()!;
    const priceOracle = comptroller.priceOracle;

    if (!priceOracle) {
      return [];
    }

    const eventNames = Object.values(PriceOracleEventName);
    const abi = filterAbi(UniswapAnchoredViewAbi, eventNames);

    const logs = await this.web3Service.getFilteredLogsByPieces(
      [priceOracle],
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    const decodedLogs = sortLogs(this.web3Service.decodeLogs(logs, abi));

    return decodedLogs;
  }

  getUnderlyingPrice(tokenConfig: TokenConfigEntity): bigint {
    const priceInternal = (): bigint => {
      if (tokenConfig.priceSource === PriceSource.REPORTER) {
        return tokenConfig.price!;
      } else if (tokenConfig.priceSource == PriceSource.FIXED_USD) {
        return tokenConfig.fixedPrice;
      } else {
        const [usdPerEth, ethBaseUnit] = this.getEthPriceAndBaseUnit();
        return mulDiv(usdPerEth, tokenConfig.fixedPrice, ethBaseUnit);
      }
    };

    const underlyingPrice = mulDiv(
      BigInt(1e30),
      priceInternal(),
      tokenConfig.baseUnit,
    );

    return underlyingPrice;
  }

  getUnderlyingPriceForTransmit(tokenConfig: TokenConfigEntity): bigint {
    const underlyingPrice = this.getUnderlyingPrice(tokenConfig);

    return BigInt(underlyingPrice.toString() + '00');
  }

  getEthPriceAndBaseUnit() {
    const ethTokenConfig = this.storageService.getEthTokenConfig();

    if (!ethTokenConfig) {
      throw new Error('ETH token config not found');
    }

    return [ethTokenConfig.price!, ethTokenConfig.baseUnit];
  }

  async fetchTokenConfig({
    symbolHash,
    cToken,
    blockNumber,
  }: {
    symbolHash?: string;
    cToken?: string;
    blockNumber?: number;
  }) {
    console.debug('method -> priceOracleService.fetchTokenConfig');
    const address = this.storageService.getComptroller().priceOracle;

    const abiItem = getAbiItem(
      UniswapAnchoredViewAbi,
      'function',
      `getTokenConfigBy${symbolHash ? 'SymbolHash' : 'CToken'}`,
    );

    // console.log('abiItem', abiItem);
    // console.log('symbolHash', symbolHash);
    // console.log('cToken', cToken);
    // console.log('priceOracle', address);

    const rawTokenConfig = await this.web3Service.callContractMethod({
      address,
      abi: abiItem,
      args: [symbolHash || cToken],
      blockNumber,
    });

    const newTokenConfig: TokenConfigEntity = {
      marketAddress: rawTokenConfig.cToken,
      baseUnit: rawTokenConfig.baseUnit,
      priceSource: Number(rawTokenConfig.priceSource) as PriceSource,
      fixedPrice: rawTokenConfig.fixedPrice,
      reporterMultiplier: rawTokenConfig.reporterMultiplier,
      reporter: rawTokenConfig.reporter,
      aggregator: '',
      failoverActive: rawTokenConfig.failoverActive,
      symbolHash: rawTokenConfig.symbolHash,
    };

    return newTokenConfig;
  }

  async fetchPrice(symbol: string, blockNumber?: number) {
    const address = this.storageService.getComptroller().priceOracle;

    const abiItem = getAbiItem(UniswapAnchoredViewAbi, 'function', 'price');

    return this.web3Service.callContractMethod({
      address,
      abi: abiItem,
      args: [symbol],
      blockNumber,
    });
  }

  async createTokenConfig(cToken: string, blockNumber?: number) {
    console.debug('method -> priceOracleService.createTokenConfig');
    const tokenConfig = await this.fetchTokenConfig({ cToken, blockNumber });

    if (!tokenConfig) {
      throw new Error('Token config not found,\n' + `cToken: ${cToken}`);
    }

    if (tokenConfig.priceSource === PriceSource.REPORTER) {
      const aggregator = await this.validatorProxyService.fetchAggregator(
        tokenConfig.reporter,
        blockNumber,
      );

      if (!aggregator) {
        throw new Error(
          'Aggregator not found,\n' + `reporter: ${tokenConfig.reporter}`,
        );
      }

      tokenConfig.aggregator = aggregator;
    }

    this.storageService.setTokenConfig(cToken, tokenConfig);

    return tokenConfig;
  }

  // validateReportedPrice(config: TokenConfigEntity, reportedPrice: bigint): boolean {
  //   const priceData = config.price;
  //   const anchorPrice = this.calculateAnchorPriceFromEthPrice(config);
  //   let valid = false;
  //
  //   if (config.failoverActive) {
  //     require(anchorPrice < 2**248, "Anchor too big");
  //     prices[config.symbolHash].price = uint248(anchorPrice);
  //     emit PriceUpdated(config.symbolHash, anchorPrice);
  //   } else if (isWithinAnchor(reportedPrice, anchorPrice)) {
  //     require(reportedPrice < 2**248, "Reported too big");
  //     prices[config.symbolHash].price = uint248(reportedPrice);
  //     emit PriceUpdated(config.symbolHash, reportedPrice);
  //     valid = true;
  //   } else {
  //     emit PriceGuarded(config.symbolHash, reportedPrice, anchorPrice);
  //   }
  // }

  // calculateAnchorPriceFromEthPrice(config: TokenConfigEntity) {
  //   if (config.priceSource == PriceSource.REPORTER) {
  //     const ethPrice = fetchEthPrice();
  //     if (config.symbolHash == ETH_HASH) {
  //       anchorPrice = ethPrice;
  //     } else {
  //       anchorPrice = fetchAnchorPrice(config, ethPrice);
  //     }
  //   }
  // }

  convertReportedPrice(config: TokenConfigEntity, reportedPrice: bigint) {
    if (reportedPrice < 0) throw new Error('Cant be neg');

    const unsignedPrice = BigInt(reportedPrice);

    const convertedPrice = mulDiv(
      unsignedPrice,
      config.reporterMultiplier,
      config.baseUnit,
    );
    return convertedPrice;
  }

  async fetchUnderlyingPrice(
    cToken: string,
    blockNumber?: number,
    priceOracle?: string,
  ) {
    console.debug('method -> priceOracleService.fetchUnderlyingPrice');

    if (blockNumber && Env.NORMAL_PRICE_ORACLE_START_BLOCK > blockNumber) {
      return BigInt(0);
    }

    const address =
      priceOracle || this.storageService.getComptroller().priceOracle;

    const abiItem = getAbiItem(
      UniswapAnchoredViewAbi,
      'function',
      'getUnderlyingPrice',
    );

    return this.web3Service.callContractMethod({
      address,
      abi: abiItem,
      args: [cToken],
      blockNumber,
    });
  }

  async fetchAndUpdateUnderlyingPrice(cToken: string, blockNumber?: number) {
    const underlyingPrice = await this.fetchUnderlyingPrice(
      cToken,
      blockNumber,
    );

    const market = this.storageService.getMarket(cToken);
    market.underlyingPriceMantissa = underlyingPrice;
  }
}
