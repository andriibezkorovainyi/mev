import { MessageType } from '../../utils/types/message.type.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';

export interface IPendingPriceConfig {
  symbolHash: string;
  price: bigint;
}

export interface PendingPriceUpdateMessage extends IMessage {
  type: MessageType.pendingPriceUpdate;
  data: {
    pendingPriceConfig: IPendingPriceConfig;
    targetTxRaw: string;
    targetTxHash: string;
  };
}
