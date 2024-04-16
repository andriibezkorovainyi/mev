import type { MessageType } from '../../utils/types/message.type.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { IMessage } from '../../utils/interfaces/message.interface.ts';

export interface NewTokenConfigsMessage extends IMessage {
  type: MessageType.newTokenConfigs;
  data: TokenConfigEntity[];
}
