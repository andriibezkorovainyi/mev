import { Module } from '../../utils/classes/module.class.ts';
import { CollectorService } from './collector.service.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { ComptrollerModule } from '../comptroller/comptroller.module.ts';
import type { MarketModule } from '../market/market.module.ts';
import type { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import type { ValidatorProxyModule } from '../validator-proxy/validator-proxy.module.ts';

export class CollectorModule extends Module {
  constructor(
    storageModule: StorageModule,
    web3Module: Web3Module,
    comptrollerModule: ComptrollerModule,
    marketModule: MarketModule,
    priceOracleModule: PriceOracleModule,
    validatorProxyModule: ValidatorProxyModule,
  ) {
    super();

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');
    const comptrollerService =
      comptrollerModule.getService('comptrollerService');
    const marketService = marketModule.getService('marketService');
    const priceOracleService =
      priceOracleModule.getService('priceOracleService');
    const validatorProxyService = validatorProxyModule.getService(
      'validatorProxyService',
    );

    const collectorService = new CollectorService(
      storageService,
      web3Service,
      comptrollerService,
      marketService,
      priceOracleService,
      validatorProxyService,
    );

    this.registerService('collectorService', collectorService);
  }
}
