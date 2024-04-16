import { LiquidatorService } from './liquidator.service.ts';
import { Module } from '../../utils/classes/module.class.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { PriceOracleModule } from '../price-oracle/price-oracle.module.ts';
import type { AccountModule } from '../account/account.module.ts';
import type { BundleModule } from '../bundle/bundle.module.ts';
import type { TelegramModule } from '../telegram/telegram.module.ts';

export class LiquidatorModule extends Module {
  constructor(
    storageModule: StorageModule,
    web3Module: Web3Module,
    priceOracleModule: PriceOracleModule,
    accountModule: AccountModule,
    bundleModule: BundleModule,
    telegramModule: TelegramModule,
  ) {
    super();
    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');
    const priceOracleService =
      priceOracleModule.getService('priceOracleService');
    const accountService = accountModule.getService('accountService');
    const bundleService = bundleModule.getService('bundleService');
    const telegramService = telegramModule.getService('telegramService');

    const liquidatorService = new LiquidatorService(
      storageService,
      priceOracleService,
      web3Service,
      accountService,
      bundleService,
      telegramService,
    );

    this.registerService('liquidatorService', liquidatorService);
  }
}
