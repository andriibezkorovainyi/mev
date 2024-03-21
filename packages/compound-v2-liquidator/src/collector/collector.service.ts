import type { StorageService } from '../storage/storage.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { ComptrollerService } from '../comptroller/comptroller.service.ts';
import type { MarketService } from '../market/market.service.ts';
import { BlockFilterBatch } from '../../utils/constants/settings.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';

export class CollectorService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly comptrollerService: ComptrollerService,
    private readonly marketService: MarketService,
    private readonly priceOracleService: PriceOracleService,
  ) {
    super();
  }

  async init() {
    // await this.collectPastEvents();
  }

  async collectPastEvents() {
    console.debug('method -> collectPastEvents');

    await this.updateNetworkHeight();

    let count = 10;

    while (!this.getStatusSync()) {
      if (count === 0) {
        break;
      }

      const pointerHeight = this.storageService.getPointerHeight();
      // console.log('pointerHeight', pointerHeight);
      // const pointerHeight = UnitrollerDeploymentBlock;
      const networkHeight = this.storageService.getNetworkHeight();

      const fromBlock = pointerHeight;
      let toBlock = fromBlock + BlockFilterBatch;
      if (toBlock > networkHeight) toBlock = networkHeight;

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
        this.marketService.processLogs(marketsLogs);
      }

      const priceOracleLogs = await this.priceOracleService.collectLogs(
        fromBlock,
        toBlock,
      );

      if (priceOracleLogs.length > 0) {
        await this.priceOracleService.processLogs(priceOracleLogs);
      }

      this.storageService.setPointerHeight(toBlock + 1);
      await this.storageService.cacheMemory();

      await this.updateNetworkHeight();

      count--;
    }

    console.debug('Sync complete');
  }

  getStatusSync() {
    return (
      this.storageService.getPointerHeight() ===
      this.storageService.getNetworkHeight()
    );
  }

  async updateNetworkHeight() {
    const networkHeight = await this.web3Service.getNetworkHeight();
    this.storageService.setNetworkHeight(networkHeight);
  }

  // async collectUnitrollerEvents(fromBlock: number, toBlock: number) {
  //   console.debug('method -> collectUnitrollerEvents');
  //
  //   const address = this.env.COMPTROLLER_PROXY_ADDRESS;
  //   const eventNames = UnitrollerSearchEventNames;
  //   const abi = filterAbi(Unitroller.abi, eventNames);
  //
  //   const logs = await this.web3Service.getFilteredLogs(
  //     [address],
  //     abi,
  //     fromBlock,
  //     toBlock,
  //   );
  //
  //   const decodedLogs = this.web3Service.decodeLogs(logs, abi);
  //
  //   const implementations = decodedLogs.map(
  //     (decodedLog) => decodedLog.newImplementation,
  //   );
  //
  //   const last = implementations[implementations.length - 1];
  //
  //   if (last) {
  //     this.storageService.setComptroller({ implementationAddress: last });
  //   }
  //
  //   return implementations;
  // }
}
