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
import { ValidatorProxyModule } from '../validator-proxy/validator-proxy.module.ts';
import { LiquidatorModule } from '../liquidator/liquidator.module.ts';
import { BundleModule } from '../bundle/bundle.module.ts';
import { BlockModule } from '../block/block.module.ts';
import { TelegramModule } from '../telegram/telegram.module.ts';

export default class MasterModule extends Module {
  public readonly cacheModule: CacheModule;
  public readonly web3Module: Web3Module;
  public readonly storageModule: StorageModule;
  public readonly accountModule: AccountModule;
  public readonly priceOracleModule: PriceOracleModule;
  public readonly marketModule: MarketModule;
  public readonly comptrollerModule: ComptrollerModule;
  public readonly validatorProxyModule: ValidatorProxyModule;
  public readonly collectorModule: CollectorModule;
  public readonly workerModule: WorkerModule;
  public readonly liquidatorModule: LiquidatorModule;
  public readonly bundleModule: BundleModule;
  public readonly blockModule: BlockModule;
  public readonly telegramModule: TelegramModule;

  constructor(mempoolWorker: Worker | undefined) {
    super();
    this.telegramModule = new TelegramModule();
    this.cacheModule = new CacheModule();
    this.web3Module = new Web3Module(Env.HTTPS_RPC_URL);
    this.storageModule = new StorageModule(this.cacheModule);
    this.accountModule = new AccountModule(this.storageModule, this.web3Module);
    this.marketModule = new MarketModule(
      this.storageModule,
      this.web3Module,
      this.accountModule,
      this.telegramModule,
    );
    this.validatorProxyModule = new ValidatorProxyModule(
      this.web3Module,
      this.storageModule,
    );
    this.priceOracleModule = new PriceOracleModule(
      this.web3Module,
      this.storageModule,
      this.validatorProxyModule,
      this.marketModule,
    );

    this.bundleModule = new BundleModule(this.web3Module);

    this.liquidatorModule = new LiquidatorModule(
      this.storageModule,
      this.web3Module,
      this.priceOracleModule,
      this.accountModule,
      this.bundleModule,
      this.telegramModule,
    );

    this.workerModule = new WorkerModule(mempoolWorker, this.liquidatorModule);

    this.validatorProxyModule.setupWorkerModule(this.workerModule);

    this.comptrollerModule = new ComptrollerModule(
      this.storageModule,
      this.web3Module,
      this.accountModule,
      this.priceOracleModule,
      this.marketModule,
      this.workerModule,
    );

    this.collectorModule = new CollectorModule(
      this.storageModule,
      this.web3Module,
      this.comptrollerModule,
      this.marketModule,
      this.priceOracleModule,
      this.validatorProxyModule,
    );
    this.blockModule = new BlockModule(
      this.collectorModule,
      this.storageModule,
    );

    const storageService = this.storageModule.getService('storageService');
    const workerService = this.workerModule.getService('workerService');
    const web3Service = this.web3Module.getService('web3Service');
    const collectorService =
      this.collectorModule.getService('collectorService');
    const blockService = this.blockModule.getService('blockService');
    const telegramService = this.telegramModule.getService('telegramService');

    const masterService = new MasterService(
      storageService,
      workerService,
      web3Service,
      collectorService,
      blockService,
      telegramService,
    );

    this.registerService('masterService', masterService);
  }
}
