import { beforeAll, describe, expect, it } from 'bun:test';
import type { BlockService } from './block.service.ts';
import MasterModule from '../master/master.module.ts';
import { delay } from '../../../../common/helpers/delay.ts';
import type { StorageService } from '../storage/storage.service.ts';

describe('Block', () => {
  let blockService: BlockService;
  let storageService: StorageService;

  beforeAll(() => {
    const masterModule = new MasterModule(undefined as unknown as Worker);
    const masterService = masterModule.getService('masterService');

    masterService.listenForShutdown();
    blockService = masterModule.blockModule.getService('blockService');
    storageService = masterModule.storageModule.getService('storageService');
  });

  it('should listen for new block headers', async () => {
    blockService.listenForNewBlocks();
    await delay(10_000);
    const networkHeight = storageService.getNetworkHeight();
    const baseFeePerGas = storageService.getBaseFeePerGas();

    expect(networkHeight).toBeGreaterThan(0);
    expect(baseFeePerGas).toBeGreaterThan(0n);
  }, 600_000);
});
