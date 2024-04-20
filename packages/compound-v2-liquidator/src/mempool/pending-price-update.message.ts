import { MessageType } from '../../utils/types/message.type.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';

export interface IPendingPriceConfig {
  symbolHash: string;
  price: bigint;
}

export interface IPendingPriceUpdateData {
  pendingPriceConfig: IPendingPriceConfig;
  targetTxRaw: string;
  targetTxHash: string;
}

export interface PendingPriceUpdateMessage extends IMessage {
  type: MessageType.pendingPriceUpdate;
  data: IPendingPriceUpdateData;
}
