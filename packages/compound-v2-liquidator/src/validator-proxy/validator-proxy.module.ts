import { Module } from '../../utils/classes/module.class.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import type { StorageModule } from '../storage/storage.module.ts';
import { ValidatorProxyService } from './validator-proxy.service.ts';
import type { WorkerModule } from '../worker/worker.module.ts';

export class ValidatorProxyModule extends Module {
  public workerModule: WorkerModule | undefined;
  public readonly service: ValidatorProxyService;

  constructor(
    public readonly web3Module: Web3Module,
    public readonly storageModule: StorageModule,
  ) {
    super();

    const storageService = storageModule.getService('storageService');
    const web3Service = web3Module.getService('web3Service');

    this.service = new ValidatorProxyService(storageService, web3Service);

    this.registerService('validatorProxyService', this.service);
  }

  setupWorkerModule(workerModule: WorkerModule) {
    this.workerModule = workerModule;
    const workerService = this.workerModule.getService('workerService');
    this.service.workerService = workerService;
  }
}
