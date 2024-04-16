import { Module } from '../../utils/classes/module.class.ts';
import type { CollectorModule } from '../collector/collector.module.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import { BlockService } from './block.service.ts';

export class BlockModule extends Module {
  constructor(
    public readonly collectorModule: CollectorModule,
    public readonly storageModule: StorageModule,
  ) {
    super();

    const collectorService = collectorModule.getService('collectorService');
    const storageService = storageModule.getService('storageService');
    const service = new BlockService(storageService, collectorService);
    this.registerService('blockService', service);
  }
}
