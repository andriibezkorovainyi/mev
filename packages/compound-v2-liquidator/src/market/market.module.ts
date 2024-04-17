import { Module } from '../../utils/classes/module.class.ts';
import { MarketService } from './market.service.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { AccountModule } from '../account/account.module.ts';
import type { TelegramModule } from '../telegram/telegram.module.ts';

export class MarketModule extends Module {
  constructor(
    private readonly storageModule: StorageModule,
    private readonly web3Module: Web3Module,
    private readonly accountModule: AccountModule,
    private readonly telegramModule: TelegramModule,
  ) {
    super();
    const storageService = this.storageModule.getService('storageService');
    const web3Service = this.web3Module.getService('web3Service');
    const accountService = this.accountModule.getService('accountService');
    const telegramService = this.telegramModule.getService('telegramService');

    const service = new MarketService(
      storageService,
      web3Service,
      accountService,
      telegramService,
    );

    this.registerService('marketService', service);
  }
}
