import { Module } from '../../utils/classes/module.class.ts';
import { CollectorService } from './collector.service.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { ComptrollerModule } from '../comptroller/comptroller.module.ts';
import type { MarketModule } from '../market/market.module.ts';
import type { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';

export class CollectorModule extends Module {
  constructor(
    private readonly storageModule: StorageModule,
    private readonly web3Module: Web3Module,
    private readonly comptrollerModule: ComptrollerModule,
    private readonly marketModule: MarketModule,
    private readonly priceOracleModule: PriceOracleModule,
  ) {
    super();

    const storageService = this.storageModule.getService('storageService');
    const web3Service = this.web3Module.getService('web3Service');
    const comptrollerService =
      this.comptrollerModule.getService('comptrollerService');
    const marketService = this.marketModule.getService('marketService');
    const priceOracleService =
      this.priceOracleModule.getService('priceOracleService');

    const collectorService = new CollectorService(
      storageService,
      web3Service,
      comptrollerService,
      marketService,
      priceOracleService,
    );

    this.registerService('collectorService', collectorService);
  }
}
