import type { IService } from '../../../../common/interfaces/service.interface.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';
import { MessageType } from '../../utils/types/message.type.ts';
import type { LiquidatorService } from '../liquidator/liquidator.service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { PendingPriceUpdateMessage } from '../mempool/pending-price-update.message.ts';

export class WorkerService implements IService {
  constructor(
    private readonly mempoolWorker: Worker | undefined,
    private readonly liquidatorService: LiquidatorService,
  ) {}

  init() {
    if (!this.mempoolWorker) {
      return;
    }

    this.listenForMessages();
    this.initMempoolListener();
  }

  emitNewTokenConfigs(newTokenConfigs: TokenConfigEntity[]) {
    this.mempoolWorker?.postMessage({
      type: MessageType.newTokenConfigs,
      data: newTokenConfigs,
    });
  }

  initMempoolListener() {
    this.mempoolWorker?.postMessage({ type: MessageType.init });
  }

  listenForMessages() {
    if (!this.mempoolWorker) {
      return;
    }

    this.mempoolWorker.onmessage = async (event) => {
      console.debug('method -> workerService.listenForMessages');
      const message: IMessage = event.data;

      switch (message.type) {
        case MessageType.pendingPriceUpdate:
          await this.liquidatorService.processPendingPriceUpdate(
            message as PendingPriceUpdateMessage,
          );
          break;
      }
    };
  }

  listenForMempoolWorkerStop() {
    if (this.mempoolWorker) {
      this.mempoolWorker.addEventListener('close', () => {
        console.log('Mempool worker terminated by itself');
      });
    }
  }

  terminate() {
    console.log('method -> workerService.terminate');

    if (this.mempoolWorker) {
      this.mempoolWorker.terminate();
    }
  }
}
