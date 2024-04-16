import { Service } from '../../utils/classes/service.ts';
import { MessageType } from '../../utils/types/message.type.ts';
import type { MempoolService } from './mempool.service.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';
import type { NewTokenConfigsMessage } from '../worker/new-token-configs.message.ts';

declare let self: Worker;

export class MessageService extends Service {
  constructor(private readonly mempoolService: MempoolService) {
    super();
  }

  init() {
    this.listenForShutdown();
    this.subscribeToMessages();
  }

  subscribeToMessages() {
    console.log('method -> messageService.subscribeToMessages');

    self.onmessage = async (event) => {
      const message = event.data as IMessage;

      switch (message.type) {
        case MessageType.init:
          await this.mempoolService.init();
          break;
        case MessageType.newTokenConfigs:
          this.mempoolService.handleNewTokenConfigs(
            message as NewTokenConfigsMessage,
          );
          break;
        default:
          break;
      }
    };
  }

  listenForShutdown() {
    process.on('SIGINT', this.cleanUpAndExit.bind(this));
    process.on('SIGTERM', this.cleanUpAndExit.bind(this));
    process.on('uncaughtException', this.cleanUpAndExit.bind(this));
    process.on('unhandledRejection', this.cleanUpAndExit.bind(this));
  }

  cleanUpAndExit(message: any) {
    console.debug('method -> mempoolService.cleanUpAndExit');
    console.log(message);

    this.mempoolService.terminate();

    process.exit(1);
  }
}
