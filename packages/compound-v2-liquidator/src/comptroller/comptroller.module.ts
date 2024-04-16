import { Module } from '../../utils/classes/module.class.ts';
import { ComptrollerService } from './comptroller.service.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { AccountModule } from '../account/account.module.ts';
import type { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import type { MarketModule } from '../market/market.module.ts';
import type { WorkerModule } from '../worker/worker.module.ts';

export class ComptrollerModule extends Module {
  constructor(
    storageModule: StorageModule,
    web3Module: Web3Module,
    accountModule: AccountModule,
    priceOracleModule: PriceOracleModule,
    marketModule: MarketModule,
    workerModule: WorkerModule,
  ) {
    super();

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');
    const accountService = accountModule.getService('accountService');
    const priceOracleService =
      priceOracleModule.getService('priceOracleService');
    const marketService = marketModule.getService('marketService');
    const workerService = workerModule.getService('workerService');

    const service = new ComptrollerService(
      storageService,
      web3Service,
      marketService,
      accountService,
      priceOracleService,
      workerService,
    );

    this.registerService('comptrollerService', service);
  }
}
