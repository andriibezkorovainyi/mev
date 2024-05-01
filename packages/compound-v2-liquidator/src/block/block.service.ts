import { Service } from '../../utils/classes/service.ts';
import type { CollectorService } from '../collector/collector.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import Env from '../../utils/constants/env.ts';

export class BlockService extends Service {
  private ws: WebSocket | undefined;
  private subscriptionId: string | undefined;

  constructor(
    private readonly storageService: StorageService,
    private readonly collectorService: CollectorService,
  ) {
    super();
  }

  listenForNewBlocks() {
    this.ws?.close();

    this.ws = new WebSocket(Env.BLOXROUTE_WS_URL, {
      rejectUnauthorized: false,
      headers: {
        Authorization: Env.BLOXROUTE_AUTH_HEADER,
      },
    });

    this.ws!.onopen = this.proceedNewBlocksSubscription.bind(this);
    this.ws!.onmessage = this.handleNewBlock.bind(this);
    this.ws!.onerror = console.error;
    this.ws!.onclose = async () => {
      console.log('Connection closed');
    };
  }

  async handleNewBlock(nextNotification) {
    try {
      const data = JSON.parse(nextNotification.data);
      if (!data) throw new Error('Invalid data');
      if (data.error) throw new Error(data.error);

      if (typeof data.result === 'string') {
        this.subscriptionId = data.result;
        console.log('Subscription ID:', this.subscriptionId);
        return;
      }

      const { number, baseFeePerGas } = data.params.result.header;

      this.storageService.setNetworkHeight(number);
      this.storageService.setBaseFeePerGas(baseFeePerGas);

      console.log(
        'New base fee per gas:',
        this.storageService.getBaseFeePerGas(),
      );

      console.log(
        'typeof base fee is string:',
        typeof baseFeePerGas === 'string',
      );
      console.log(
        'typeof base fee is bigint:',
        typeof baseFeePerGas === 'bigint',
      );
      await this.collectorService.collectPastEvents(false);
    } catch (e) {
      console.error(e);
    }
  }

  proceedNewBlocksSubscription() {
    console.log('blockService -> Connection established');

    const data = JSON.stringify({
      id: 1,
      method: 'subscribe',
      params: [
        'newBlocks',
        {
          include: ['header'],
        },
      ],
    });

    this.ws?.send(data);
  }

  unsubscribeNewBlocks() {
    if (this.ws && this.subscriptionId) {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'unsubscribe',
        params: [this.subscriptionId],
      });

      this.ws.send(data);
    }
  }

  terminate() {
    if (this.ws) {
      this.unsubscribeNewBlocks();
      this.ws.close();
    }
  }
}
