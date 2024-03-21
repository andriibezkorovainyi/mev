import { CacheModule } from '../cache/cache.module.ts';
import { StorageModule } from '../storage/storage.module.ts';
import { Web3Module } from '../web3/web3.module.ts';
import { ComptrollerModule } from '../comptroller/comptroller.module.ts';
import { MarketModule } from '../market/market.module.ts';
import { AccountModule } from '../account/account.module.ts';
import { CollectorModule } from '../collector/collector.module.ts';
import { WorkerModule } from '../worker/worker.module.ts';
import { Module } from '../../utils/classes/module.class.ts';
import { MasterService } from './master.service.ts';
import { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import Env from '../../utils/constants/env.ts';
import { AggregatorModule } from '../aggregator/aggregator.module.ts';

export default class MasterModule extends Module {
  constructor(mempoolWorker: Worker) {
    super();
    const cacheModule = new CacheModule();
    const web3Module = new Web3Module(Env.HTTPS_RPC_URL);
    const storageModule = new StorageModule(cacheModule);
    const accountModule = new AccountModule(storageModule, web3Module);
    const priceOracleModule = new PriceOracleModule(web3Module, storageModule);
    const aggregatorModule = new AggregatorModule(web3Module, storageModule);

    const comptrollerModule = new ComptrollerModule(
      storageModule,
      web3Module,
      accountModule,
      priceOracleModule,
      aggregatorModule,
    );
    const marketModule = new MarketModule(
      storageModule,
      web3Module,
      accountModule,
    );
    const collectorModule = new CollectorModule(
      storageModule,
      web3Module,
      comptrollerModule,
      marketModule,
      priceOracleModule,
    );
    const workerModule = new WorkerModule(mempoolWorker);

    const storageService = storageModule.getService('storageService');
    const workerService = workerModule.getService('workerService');
    const web3Service = web3Module.getService('web3Service');
    const collectorService = collectorModule.getService('collectorService');

    const masterService = new MasterService(
      storageService,
      workerService,
      web3Service,
      collectorService,
    );

    this.registerService('masterService', masterService);
  }
}
