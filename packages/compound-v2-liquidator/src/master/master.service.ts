import type { StorageService } from '../storage/storage.service.ts';
import type { WorkerService } from '../worker/worker.service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { CollectorService } from '../collector/collector.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { BlockService } from '../block/block.service.ts';
import Env from '../../utils/constants/env.ts';

export class MasterService extends Service {
  constructor(
    public readonly storageService: StorageService,
    public readonly workerService: WorkerService,
    public readonly web3Service: Web3Service,
    private readonly collectorService: CollectorService,
    private readonly blockService: BlockService,
  ) {
    super();
  }

  async init() {
    this.listenForShutdown();

    await this.storageService.init().catch(this.cleanUpAndExit.bind(this));

    await this.collectorService
      .collectPastEvents()
      .catch(this.cleanUpAndExit.bind(this));

    Env.SHOULD_FETCH_EXCHANGE_RATES = true;

    this.blockService.listenForNewBlocks();

    this.workerService.init();
  }

  listenForShutdown() {
    process.on('SIGINT', this.cleanUpAndExit.bind(this));
    process.on('SIGTERM', this.cleanUpAndExit.bind(this));
    process.on('uncaughtException', this.cleanUpAndExit.bind(this));
    process.on('unhandledRejection', this.cleanUpAndExit.bind(this));

    this.workerService.listenForMempoolWorkerStop();
  }

  cleanUpAndExit(message: any) {
    console.debug('method -> masterService.cleanUpAndExit');
    console.log(message);

    this.workerService.terminate();
    this.blockService.terminate();

    process.exit(1);
  }
}
