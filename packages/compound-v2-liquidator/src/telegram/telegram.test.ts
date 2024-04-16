import { describe, it } from 'bun:test';
import { TelegramService } from './telegram.service.ts';
import { delay } from '../../../../common/helpers/delay.ts';

describe('Telegram', () => {
  let telegramService: TelegramService;

  it('should listen for incoming messages', async () => {
    telegramService = new TelegramService();
    await telegramService.init();
    // telegramService.sendBundleInfo('Test message');

    await delay(600_000);
  }, 600_000);
});
