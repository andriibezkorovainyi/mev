import { Module } from '../../utils/classes/module.class.ts';
import { MempoolService } from './mempool.service.ts';
import { Web3Module } from '../web3/web3.module.ts';
import Env from '../../utils/constants/env.ts';
import { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import { StorageModule } from '../storage/storage.module.ts';
import { CacheModule } from '../cache/cache.module.ts';
import { MessageService } from './message.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { MarketModule } from '../market/market.module.ts';
import { AccountModule } from '../account/account.module.ts';
import { ValidatorProxyModule } from '../validator-proxy/validator-proxy.module.ts';
import { TelegramModule } from '../telegram/telegram.module.ts';

export default class MempoolModule extends Module {
  public readonly storageService: StorageService;
  public readonly web3Service: Web3Service;
  public readonly priceOracleService: PriceOracleService;
  public readonly messageService: MessageService;

  constructor() {
    super();
    const web3Module = new Web3Module(Env.WSS_RPC_URL);
    const cacheModule = new CacheModule();
    const storageModule = new StorageModule(cacheModule);
    const accountModule = new AccountModule(storageModule, web3Module);
    const validatorProxyModule = new ValidatorProxyModule(
      web3Module,
      storageModule,
    );
    const telegramModule = new TelegramModule();
    const marketModule = new MarketModule(
      storageModule,
      web3Module,
      accountModule,
      telegramModule,
    );
    const priceOracleModule = new PriceOracleModule(
      web3Module,
      storageModule,
      validatorProxyModule,
      marketModule,
    );

    this.storageService = storageModule.getService('storageService');
    this.web3Service = web3Module.getService('web3Service');
    this.priceOracleService =
      priceOracleModule.getService('priceOracleService');

    const mempoolService = new MempoolService(
      this.storageService,
      this.web3Service,
      this.priceOracleService,
      undefined,
    );

    this.messageService = new MessageService(mempoolService);

    this.registerService('mempoolService', mempoolService);
  }
}
