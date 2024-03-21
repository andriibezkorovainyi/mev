import { Module } from '../../utils/classes/module.class.ts';
import { MempoolService } from './mempool.service.ts';
import { Web3Module } from '../web3/web3.module.ts';
import Env from '../../utils/constants/env.ts';
import { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import { StorageModule } from '../storage/storage.module.ts';
import { CacheModule } from '../cache/cache.module.ts';
import { MessageService } from './message.service.ts';

export default class MempoolModule extends Module {
  constructor() {
    super();
    const web3Module = new Web3Module(Env.WSS_RPC_URL);
    const cacheModule = new CacheModule();
    const storageModule = new StorageModule(cacheModule);
    const priceOracleModule = new PriceOracleModule(web3Module, storageModule);

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');
    const priceOracleService =
      priceOracleModule.getService('priceOracleService');
    const messageService = new MessageService();

    const mempoolService = new MempoolService(
      storageService,
      web3Service,
      priceOracleService,
      messageService,
    );

    this.registerService('mempoolService', mempoolService);
  }
}
