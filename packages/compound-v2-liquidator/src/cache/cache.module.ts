import { CacheService } from './cache.service.ts';
import { Module } from '../../utils/classes/module.class.ts';

export class CacheModule extends Module {
  constructor() {
    super();

    const cacheService = new CacheService();

    this.registerService('cacheService', cacheService);
  }
}
