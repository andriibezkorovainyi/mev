import { Module } from '../../utils/classes/module.class.ts';
import { ComptrollerService } from './comptroller.service.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { AccountModule } from '../account/account.module.ts';
import type { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import type { AggregatorModule } from '../aggregator/aggregator.module.ts';

export class ComptrollerModule extends Module {
  constructor(
    storageModule: StorageModule,
    web3Module: Web3Module,
    accountModule: AccountModule,
    priceOracleModule: PriceOracleModule,
    aggregatorModule: AggregatorModule,
  ) {
    super();

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');
    const accountService = accountModule.getService('accountService');
    const priceOracleService =
      priceOracleModule.getService('priceOracleService');
    const aggregatorService = aggregatorModule.getService('aggregatorService');

    const service = new ComptrollerService(
      storageService,
      web3Service,
      accountService,
      priceOracleService,
      aggregatorService,
    );

    this.registerService('comptrollerService', service);
  }
}
