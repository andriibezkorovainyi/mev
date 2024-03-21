import { beforeEach, describe, expect, it } from 'bun:test';
import { StorageService } from '../storage/storage.service.ts';
import { AccountService } from '../account/account.service.ts';
import { MarketService } from './market.service.ts';
import { CacheService } from '../cache/cache.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import Env from '../../utils/constants/env.ts';

describe('MarketService', () => {
  const accounts = ['0x502CB8985B2C92a8d4bf309cDAa89DE9be442708'];

  let cacheService: CacheService;
  let marketService: MarketService;
  let storageService: StorageService;
  let accountService: AccountService;
  let web3Service: Web3Service;

  beforeEach(async () => {
    // Setup your service with mocks or stubs if necessary
    web3Service = new Web3Service(Env.HTTPS_RPC_URL); // Assuming Web3Service is a class that can be instantiated
    cacheService = new CacheService(); // Assuming CacheService is a class that can be instantiated
    storageService = new StorageService(cacheService); // Assuming StorageService is a class that can be instantiated
    accountService = new AccountService(storageService, web3Service); // Assuming AccountService is a class that can be instantiated
    marketService = new MarketService(
      storageService,
      web3Service,
      accountService,
    );

    await storageService.init();
  });

  describe('mint', () => {
    it('should fund account tokens if account exists', async () => {
      const account = new AccountEntity();
      storageService.getAccounts = () => new Map([['minter', account]]);

      const log = {
        address: 'cToken',
        minter: 'minter',
        mintAmount: 'mintAmount',
        mintTokens: 'mintTokens',
      };

      await marketService.mint(log);

      // Here, instead of verify, you should have some way to check the outcome.
      // For example, assuming AccountEntity has a method to check tokens:
      expect(account.tokens).toEqual(log.mintTokens);
    });

    it('should not fund account tokens if mint amount is zero', async () => {
      const account = new AccountEntity();
      storageService.getAccounts = () => new Map([['minter', account]]);

      const log = {
        address: 'cToken',
        minter: 'minter',
        mintAmount: '0',
        mintTokens: 'mintTokens',
      };

      await marketService.mint(log);

      // Assuming AccountEntity initializes with no tokens or a method to check it
      expect(account.tokens).toBeUndefined();
    });

    it('should create account with tokens if account does not exist', async () => {
      storageService.getAccounts = () => new Map();

      const log = {
        address: 'cToken',
        minter: 'minter',
        mintAmount: 'mintAmount',
        mintTokens: 'mintTokens',
      };

      await marketService.mint(log);

      // Assuming MarketService adds the account to the storage,
      // and StorageService has a way to retrieve it:
      const newAccount = storageService.getAccount(log.minter);
      expect(newAccount).toBeDefined();
      expect(newAccount.tokens).toEqual(log.mintTokens);
    });
  });

  describe('redeem', () => {
    it('should reduce market total cash and supply', async () => {
      const market = new MarketEntity();
      market.totalCash = 1000; // Example initial values
      market.totalSupply = 500;

      storageService.getMarket = () => market;

      const log = {
        address: 'cToken',
        redeemAmount: 'redeemAmount',
        redeemTokens: 'redeemTokens',
      };

      await marketService.redeem(log);

      expect(market.totalCash).toBeLessThan(1000);
      expect(market.totalSupply).toBeLessThan(500);
    });
  });

  // ... other tests ...
});
