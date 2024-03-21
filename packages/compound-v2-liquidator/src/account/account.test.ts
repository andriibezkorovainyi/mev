import { beforeEach, describe, expect, it } from 'bun:test';
import { AccountService } from './account.service.ts';
import { CacheService } from '../cache/cache.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import Env from '../../utils/constants/env.ts';

describe('AccountService', () => {
  let accountService: AccountService;
  let web3Service: Web3Service;
  let storageService: StorageService;
  let cacheService: CacheService;

  beforeEach(async () => {
    // Setup your service with mocks or stubs if necessary
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);
    accountService = new AccountService(storageService, web3Service);

    await storageService.init();
  });

  it('should correct parse account token balance', async () => {
    const accounts = storageService.getAccounts();
    const pointerHeight = storageService.getPointerHeight();

    let count = 10;
    for (const [address, account] of accounts) {
      if (count === 0) {
        break;
      }
      count -= 1;
      const tokens = Object.entries(account.tokens);
      // const asset = account.assets[0];
      // console.log('asset', asset);
      const tokenBalance = tokens[0][1];
      // console.log('tokenBalance', tokenBalance);
      const fetchedBalance = await accountService.getAccountTokenBalance(
        account.address,
        tokens[0][0],
        pointerHeight,
      );

      console.log('tokenBalance', tokenBalance);
      console.log('fetchedBalance', fetchedBalance);
      expect(tokenBalance).toEqual(fetchedBalance);
    }
  });
});
