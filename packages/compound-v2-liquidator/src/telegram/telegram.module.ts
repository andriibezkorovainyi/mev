import { Module } from '../../utils/classes/module.class.ts';
import { TelegramService } from './telegram.service.ts';

export class TelegramModule extends Module {
  constructor() {
    super();

    const service = new TelegramService();
    this.registerService('telegramService', service);
  }
}
