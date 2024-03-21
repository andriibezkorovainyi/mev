import type { IService } from '../../../../common/interfaces/service.interface.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';
import { MessageType } from '../../utils/types/message.type.ts';
import type { LiquidatorService } from '../liquidator/liquidator.service.ts';

export class WorkerService implements IService {
  constructor(
    private readonly mempoolWorker: Worker,
    private readonly liquidatorService: LiquidatorService,
  ) {}

  init() {
    if (this.mempoolWorker) {
      this.listenForMessages();
    }
  }

  listenForMessages() {
    this.mempoolWorker.onmessage = async (event) => {
      const message: IMessage = event.data;

      switch (message.type) {
        case MessageType.pendingPriceUpdate:
          await this.liquidatorService.processPendingPriceUpdate(message.data);
          break;
      }
    };
  }

  sendMessage(message: any) {
    this.mempoolWorker.postMessage(message);
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
