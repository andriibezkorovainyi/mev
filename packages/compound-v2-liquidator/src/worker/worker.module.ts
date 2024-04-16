import { Module } from '../../utils/classes/module.class.ts';
import { WorkerService } from './worker.service.ts';
import type { LiquidatorModule } from '../liquidator/liquidator.module.ts';

export class WorkerModule extends Module {
  constructor(
    mempoolWorker: Worker | undefined,
    liquidatorModule: LiquidatorModule,
  ) {
    super();

    const liquidatorService = liquidatorModule.getService('liquidatorService');
    const service = new WorkerService(mempoolWorker, liquidatorService);

    this.registerService('workerService', service);
  }
}
