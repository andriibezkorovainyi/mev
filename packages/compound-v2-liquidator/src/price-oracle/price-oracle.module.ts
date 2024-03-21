import { Module } from '../../utils/classes/module.class.ts';
import { PriceOracleService } from './price-oracle.service.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { StorageModule } from '../storage/storage.module.ts';

export class PriceOracleModule extends Module {
  constructor(
    private readonly web3Module: Web3Module,
    private readonly storageModule: StorageModule,
  ) {
    super();

    const priceOracleService = new PriceOracleService(
      this.web3Module.getService('web3Service'),
      this.storageModule.getService('storageService'),
    );

    this.registerService('priceOracleService', priceOracleService);
  }
}
