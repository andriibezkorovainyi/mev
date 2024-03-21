import type { CacheModule } from '../cache/cache.module.ts';
import { StorageService } from './storage.service.ts';
import { Module } from '../../utils/classes/module.class.ts';

export class StorageModule extends Module {
  constructor(cacheModule: CacheModule) {
    super();

    const cacheService = cacheModule.getService('cacheService');
    const storageService = new StorageService(cacheService);

    this.registerService('storageService', storageService);
  }
}
