import { AccountService } from './account.service.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import { Module } from '../../utils/classes/module.class.ts';

export class AccountModule extends Module {
  constructor(
    private readonly storageModule: StorageModule,
    private readonly web3Module: Web3Module,
  ) {
    super();
    const storageService = this.storageModule.getService('storageService');
    const web3Service = this.web3Module.getService('web3Service');

    const accountService = new AccountService(storageService, web3Service);
    this.registerService('accountService', accountService);
  }
}
