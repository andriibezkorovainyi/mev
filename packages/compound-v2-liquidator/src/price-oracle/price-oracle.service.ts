import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import UniswapAnchoredViewAbi from '../../../../common/compound-protocol/artifacts/UniswapAnchoredView.sol/UniswapAnchoredView.json';
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

export class PriceOracleService extends Service {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async processLogs(logs) {
    console.debug('method -> processLogs');

    for (const log of logs) {
      switch (log.eventName) {
        case PriceOracleEventName.PriceUpdated:
          await this.priceUpdated(log);
          break;
        case PriceOracleEventName.FailoverActivated:
          console.log('FailoverActivated');
          break;
        case PriceOracleEventName.FailoverDeactivated:
          console.log('FailoverDeactivated');
          break;
        default:
          console.warn('Unknown event', log.eventName);
      }
    }
  }

  private async priceUpdated(log) {
    console.debug('method -> priceOracleService.priceUpdated');
    const [key1, key2] =
      PriceOracleEventToOutput[PriceOracleEventName.PriceUpdated].split(',');

    const symbolHash = log[key1];
    const price = log[key2];

    let tokenConfig =
      this.storageService.getTokenConfigBySymbolHash(symbolHash);

    if (!tokenConfig) {
      const newTokenConfig = await this.fetchTokenConfig(symbolHash);
      this.storageService.setTokenConfig(symbolHash, newTokenConfig);
      tokenConfig = newTokenConfig;
    }

    tokenConfig.price = price;

    const market = this.storageService.getMarket(tokenConfig.marketAddress);

    if (!market) {
      throw new Error('Market not found');
    }

    market.underlyingPriceMantissa = this.getUnderlyingPrice(tokenConfig);
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> priceOracleService.collectLogs');

    const comptroller = this.storageService.getComptroller()!;
    const address = [comptroller.priceOracle];

    const eventNames = Object.values(PriceOracleEventName);
    const abi = filterAbi(UniswapAnchoredViewAbi, eventNames);

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

  getEthPriceAndBaseUnit() {
    const ethSymbolHash =
      '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4';

    const ethTokenConfig =
      this.storageService.getTokenConfigBySymbolHash(ethSymbolHash);

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
    const address = this.env.PRICE_ORACLE_ADDRESS;

    const abiItem = getAbiItem(
      UniswapAnchoredViewAbi,
      'function',
      `getTokenConfigBy${symbolHash ? 'SymbolHash' : 'CToken'}`,
    );

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

  async fetchTokenPrice(symbol: string, blockNumber?: number) {
    const address = this.env.PRICE_ORACLE_ADDRESS;

    const abiItem = getAbiItem(UniswapAnchoredViewAbi, 'function', 'price');

    return this.web3Service.callContractMethod({
      address,
      abi: abiItem,
      args: [symbol],
      blockNumber,
    });
  }

  async createTokenConfig(cToken: string) {
    const tokenConfig = await this.fetchTokenConfig({ cToken });

    this.storageService.setTokenConfig(tokenConfig.marketAddress, tokenConfig);

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

  convertReportedPrice(config, reportedPrice) {
    // Проверка на отрицательное значение
    if (reportedPrice < 0) throw new Error('Cant be neg');
    // Преобразование reportedPrice в беззнаковое значение (в JavaScript все числа с плавающей точкой уже беззнаковые)
    const unsignedPrice = BigInt(reportedPrice);
    // Вызов mulDiv для вычисления итоговой цены
    const convertedPrice = mulDiv(
      unsignedPrice,
      config.reporterMultiplier,
      config.baseUnit,
    );
    return convertedPrice;
  }

  async fetchUnderlyingPrice(cToken: string, blockNumber?: number) {
    const address = this.storageService.getComptroller().priceOracle;

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
}
