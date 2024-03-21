import { Module } from '../../utils/classes/module.class.ts';
import { WorkerService } from './worker.service.ts';

export class WorkerModule extends Module {
  constructor(mempoolWorker: Worker) {
    super();

    const service = new WorkerService(mempoolWorker);

    this.registerService('workerService', service);
  }
}
