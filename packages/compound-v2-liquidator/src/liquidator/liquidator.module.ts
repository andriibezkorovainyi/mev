import { LiquidatorService } from './liquidator.service.ts';
import { Module } from '../../utils/classes/module.class.ts';
import type { StorageModule } from '../storage/storage.module.ts';

export class LiquidatorModule extends Module {
  constructor(storageModule: StorageModule) {
    super();
    const storageService = storageModule.getService('storageService');
    const liquidatorService = new LiquidatorService(storageService);

    this.registerService('liquidatorService', liquidatorService);
  }
}
