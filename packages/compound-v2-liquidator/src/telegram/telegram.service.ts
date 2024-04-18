import { Service } from '../../utils/classes/service.ts';
import { Telegraf } from 'telegraf';
import Env from '../../utils/constants/env.ts';

export class TelegramService extends Service {
  readonly bot = new Telegraf(Env.TG_BOT_TOKEN);

  constructor() {
    super();
  }

  private async sendMessageToPeers(message: string) {
    const peers = Env.CHAT_ID.split(',');

    for (const peer of peers) {
      this.bot.telegram.sendMessage(peer, message);
    }
  }

  async sendMessage(message: string) {
    await this.sendMessageToPeers(message);
  }

  async construcAndSendMessage(parts: string[]) {
    const message = parts.join('\n');
    await this.sendMessage(message);
  }
}
