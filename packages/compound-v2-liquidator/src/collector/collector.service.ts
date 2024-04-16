import type { StorageService } from '../storage/storage.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { ComptrollerService } from '../comptroller/comptroller.service.ts';
import type { MarketService } from '../market/market.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import type { ValidatorProxyService } from '../validator-proxy/validator-proxy.service.ts';
import Env from '../../utils/constants/env.ts';

export class CollectorService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly comptrollerService: ComptrollerService,
    private readonly marketService: MarketService,
    private readonly priceOracleService: PriceOracleService,
    private readonly validatorProxyService: ValidatorProxyService,
  ) {
    super();
  }

  // async init() {
  // await this.collectPastEvents();

  // this.subscribeToNewBlocks().catch(async (error) => {
  //   console.error(error);
  //   console.log('Resubscribing to new blocks in 10 seconds...');
  //   await delay(10_000);
  //   this.init().catch(console.error);
  // });
  // }

  // async subscribeToNewBlocks() {
  //   console.debug('method -> subscribeToNewBlocks');
  //   const isSubscribed = true;
  //
  //   while (isSubscribed) {
  //     await this.collectPastEvents();
  //     await delay(10_000);
  //   }
  // }

  async collectPastEvents(shouldUpdateNetworkHeight = true) {
    console.debug('method -> collectPastEvents');

    if (shouldUpdateNetworkHeight) {
      await this.updateNetworkHeight();
    }

    while (!this.getStatusSync()) {
      const pointerHeight = this.storageService.getPointerHeight();
      const networkHeight = this.storageService.getNetworkHeight();

      const fromBlock = pointerHeight + 1;
      if (fromBlock > networkHeight) {
        throw new Error('Pointer height is greater than network height');
      }
      let toBlock = fromBlock + Env.BLOCK_FILTER_BATCH;
      if (toBlock > networkHeight) toBlock = networkHeight;

      console.log('fromBlock', fromBlock);
      console.log('toBlock', toBlock);

      const comptrollerLogs = await this.comptrollerService.collectLogs(
        fromBlock,
        toBlock,
      );
      if (comptrollerLogs.length > 0) {
        await this.comptrollerService.processLogs(comptrollerLogs);
      }

      const marketsLogs = await this.marketService.collectLogs(
        fromBlock,
        toBlock,
      );
      if (marketsLogs.length > 0) {
        await this.marketService.processLogs(marketsLogs);
      }

      const priceOracleLogs = await this.priceOracleService.collectLogs(
        fromBlock,
        toBlock,
      );
      if (priceOracleLogs.length > 0) {
        await this.priceOracleService.processLogs(priceOracleLogs);
      }

      const validatorProxyLogs = await this.validatorProxyService.collectLogs(
        fromBlock,
        toBlock,
      );
      if (validatorProxyLogs.length > 0) {
        this.validatorProxyService.processLogs(validatorProxyLogs);
      }

      this.storageService.setPointerHeight(toBlock);

      if (
        comptrollerLogs[0] ||
        marketsLogs[0] ||
        priceOracleLogs[0] ||
        validatorProxyLogs[0]
      ) {
        await this.storageService.cacheMemory();
      } else {
        await this.storageService.cachePointerHeight();
      }

      if (shouldUpdateNetworkHeight) {
        await this.updateNetworkHeight();
      }
    }

    console.debug('Sync complete');
  }

  getStatusSync() {
    return (
      this.storageService.getPointerHeight() >=
      this.storageService.getNetworkHeight()
    );
  }

  async updateNetworkHeight() {
    const networkHeight = await this.web3Service.getNetworkHeight();
    this.storageService.setNetworkHeight(networkHeight);
  }
}
