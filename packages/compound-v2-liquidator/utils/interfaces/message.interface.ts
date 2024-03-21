import type { MessageType } from '../types/message.type.ts';

export interface IMessage {
  type: MessageType;
  data: any;
}
