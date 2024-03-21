import { Module } from '../../utils/classes/module.class.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import { AggregatorService } from './aggregator.service.ts';
import type { StorageModule } from '../storage/storage.module.ts';

export class AggregatorModule extends Module {
  constructor(web3Module: Web3Module, storageModule: StorageModule) {
    super();

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');

    const aggregatorService = new AggregatorService(
      storageService,
      web3Service,
    );

    this.registerService('aggregatorService', aggregatorService);
  }
}
