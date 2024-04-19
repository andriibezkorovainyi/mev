import { Service } from '../../utils/classes/service.ts';
import { Telegraf } from 'telegraf';
import Env from '../../utils/constants/env.ts';

export class TelegramService extends Service {
  readonly bot = new Telegraf(Env.TG_BOT_TOKEN);

  constructor() {
    super();
  }

  async sendMessage(message: string) {
    console.debug('method -> telegramService.sendMessage');
    if (!Env.SHOULD_SEND_TELEGRAM) return;

    const peers = Env.CHAT_ID.split(',');

    for (const peer of peers) {
      try {
        if (message.length > 4096) {
          const parts = message.split('\n');
          const half = parts.splice(0, Math.floor(parts.length / 2));

          await this.bot.telegram.sendMessage(peer, half.join('\n'));
          await this.bot.telegram.sendMessage(peer, parts.join('\n'));
        } else {
          await this.bot.telegram.sendMessage(peer, message);
        }
      } catch (error) {
        console.error(error);
        console.error('message', message);
        throw error;
      }
    }
  }

  async construcAndSendMessage(parts: string[]) {
    const message = parts.join('\n');
    await this.sendMessage(message);
  }
}
