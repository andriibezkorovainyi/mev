import { Service } from '../../utils/classes/service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import { MessageType } from '../../utils/types/message.type.ts';

export class MessageService extends Service {
  constructor() {
    super();
  }

  emitPendingPriceUpdate(tokenConfig: TokenConfigEntity) {
    console.log('method -> messageService.emitPendingPriceUpdate');

    const message = {
      type: MessageType.pendingPriceUpdate,
      data: tokenConfig,
    };

    postMessage(message);
  }
}
