import { beforeAll, describe, expect, it } from 'bun:test';
import type { StorageService } from '../storage/storage.service.ts';
import type { AccountService } from '../account/account.service.ts';
import type { MarketService } from './market.service.ts';
import MasterModule from '../master/master.module.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { delay } from '../../../../common/helpers/delay.ts';

describe('MarketService', () => {
  const accounts = ['0x502CB8985B2C92a8d4bf309cDAa89DE9be442708'];

  let storageService: StorageService;
  let accountService: AccountService;
  let marketService: MarketService;
  let priceOracleService: PriceOracleService;

  beforeAll(async () => {
    // // Setup your service with mocks or stubs if necessary
    // web3Service = new Web3Service(Env.HTTPS_RPC_URL); // Assuming Web3Service is a class that can be instantiated
    // cacheService = new CacheService(); // Assuming CacheService is a class that can be instantiated
    // storageService = new StorageService(cacheService); // Assuming StorageService is a class that can be instantiated
    // accountService = new AccountService(storageService, web3Service); // Assuming AccountService is a class that can be instantiated
    // marketService = new MarketService(
    //   storageService,
    //   web3Service,
    //   accountService,
    // );
    const masterModule = new MasterModule(undefined);
    storageService = masterModule.storageModule.getService('storageService');
    accountService = masterModule.accountModule.getService('accountService');
    marketService = masterModule.marketModule.getService('marketService');
    priceOracleService =
      masterModule.priceOracleModule.getService('priceOracleService');

    await storageService.initComptroller();
    await storageService.initMarkets();
    await storageService.initPointerHeight();
  });

  it('should collect correct underlyingPrices', async () => {
    // const markets = [
    // ].map((address) => storageService.getMarket(address));
    const pointerHeight = storageService.getPointerHeight();
    const markets = Object.values(storageService.getMarkets());

    console.log('pointerHeight:', pointerHeight);

    for (const market of markets) {
      const underlyingPrice = await priceOracleService.fetchUnderlyingPrice(
        market.address,
        pointerHeight,
      );

      try {
        expect(market.underlyingPriceMantissa).toEqual(underlyingPrice);
      } catch (error) {
        console.log('market:', market.symbol, market.address);
        console.error(error);
      }
    }
  }, 60_000);

  it('should collect correct exchangeRates', async () => {
    // const markets = [
    // ].map((address) => storageService.getMarket(address));
    const markets = Object.values(storageService.getMarkets());
    const pointerHeight = storageService.getPointerHeight();
    console.log('pointerHeight:', pointerHeight);

    for (const market of markets) {
      const exchangeRate = await marketService.fetchExchangeRateMantissa(
        market.address,
        pointerHeight,
      );

      try {
        expect(market.exchangeRateMantissa).toEqual(exchangeRate);
      } catch (error) {
        console.log('market:', market.address);
        console.error(error);
      }
      await delay(500);
    }
  }, 60_000);

  it('should should not collect any logs for markets before comptroller deployment', async () => {
    // const from = 7280670;
    // const to = Env.UNITROLLER_DEPLOYMENT_BLOCK;
    // const step = 5000;
    //
    // for (let i = from; i < to; i += step) {
    //   console.log('Collecting logs from', i, 'to', i + step);
    //   const logs = await marketService.collectLogs(i, i + step);
    //   expect(logs).toHaveLength(0);
    //   await delay(1000);
    // }
  }, 200_000);

  describe('collectLogs', () => {
    // it('should return empty array if no markets exist', async () => {
    //   spyOn(storageService, 'getComptroller').mockReturnValue({
    //     allMarkets: new Set(),
    //   } as ComptrollerEntity);
    //
    //   const result = await marketService.collectLogs(1, 100);
    //
    //   expect(result).toEqual([]);
    // });

    it('should return sorted logs', async () => {
      // const mockLogs = [
      //   { blockNumber: 3, transactionIndex: 1, data: 'data1' },
      //   { blockNumber: 2, transactionIndex: 2, data: 'data2' },
      //   { blockNumber: 3, transactionIndex: 2, data: 'data3' },
      //   { blockNumber: 1, transactionIndex: 1, data: 'data4' },
      //   { blockNumber: 3, transactionIndex: 1, data: 'data5' },
      //   { blockNumber: 2, transactionIndex: 1, data: 'data6' },
      //   { blockNumber: 1, transactionIndex: 2, data: 'data7' },
      //   { blockNumber: 2, transactionIndex: 2, data: 'data8' },
      // ];
      //
      // spyOn(storageService, 'getComptroller').mockReturnValue({
      //   allMarkets: new Set(['0x']),
      // } as ComptrollerEntity);
      // spyOn(web3Service, 'getFilteredLogsByPieces').mockResolvedValue(mockLogs);
      // spyOn(web3Service, 'decodeLogs').mockResolvedValue(mockLogs);
      //
      // const result = await marketService.collectLogs(1, 100);
      //
      // expect(result).toEqual([
      //   { blockNumber: 1, transactionIndex: 1, data: 'data4' },
      //   { blockNumber: 1, transactionIndex: 2, data: 'data7' },
      //   { blockNumber: 2, transactionIndex: 1, data: 'data6' },
      //   { blockNumber: 2, transactionIndex: 2, data: 'data2' },
      //   { blockNumber: 2, transactionIndex: 2, data: 'data8' },
      //   { blockNumber: 3, transactionIndex: 1, data: 'data1' },
      //   { blockNumber: 3, transactionIndex: 1, data: 'data5' },
      //   { blockNumber: 3, transactionIndex: 2, data: 'data3' },
      // ]);
    });

    // it('should decode logs', async () => {
    //   const mockLogs = [{ blockNumber: 1, transactionIndex: 1 }];
    //   const mockDecodedLogs = [
    //     { blockNumber: 1, transactionIndex: 1, decoded: true },
    //   ];
    //   spyOn(storageService, 'getComptroller').mockReturnValue({
    //     allMarkets: new Set(),
    //   } as ComptrollerEntity);
    //   spyOn(web3Service, 'getFilteredLogsByPieces').mockResolvedValue(mockLogs);
    //   spyOn(web3Service, 'decodeLogs').mockReturnValue(mockDecodedLogs);
    //
    //   const result = await marketService.collectLogs(1, 100);
    //
    //   expect(result).toEqual(mockDecodedLogs);
    // });
  });

  describe('mint', () => {
    // it('should fund account tokens if account and token exists', async () => {
    //   const log = {
    //     address: 'cToken',
    //     minter: 'minter',
    //     mintAmount: 100n,
    //     mintTokens: 10n,
    //   };
    //
    //   const initialAccount = {
    //     address: log.minter,
    //     tokens: {
    //       [log.address]: 1n,
    //     },
    //     assets: [],
    //   };
    //
    //   const initialTokens = initialAccount.tokens[log.address];
    //
    //   storageService.setMarket(log.address, {
    //     totalCash: 1000n,
    //     totalSupply: 500n,
    //   } as MarketEntity);
    //   storageService.setAccount(log.minter, initialAccount);
    //
    //   marketService.mint(log);
    //
    //   const updatedAccount = storageService.getAccount(log.minter)!;
    //
    //   expect(updatedAccount.tokens[log.address]).toEqual(
    //     initialTokens + log.mintTokens,
    //   );
    // });
    //
    // it('should create account with tokens if account does not exist', async () => {
    //   const log = {
    //     address: 'cToken',
    //     minter: 'minter',
    //     mintAmount: 100n,
    //     mintTokens: 10n,
    //   };
    //
    //   storageService.setMarket(log.address, {
    //     totalCash: 1000n,
    //     totalSupply: 500n,
    //   } as MarketEntity);
    //
    //   marketService.mint(log);
    //
    //   const updatedAccount = storageService.getAccount(log.minter)!;
    //
    //   expect(updatedAccount.tokens[log.address]).toEqual(log.mintTokens);
    // });
    //
    // it("should fund account if it exists, but token isn't", () => {
    //   const log = {
    //     address: 'cToken',
    //     minter: 'minter',
    //     mintAmount: 100n,
    //     mintTokens: 10n,
    //   };
    //
    //   const initialAccount = {
    //     address: log.minter,
    //     tokens: {},
    //     assets: [],
    //   };
    //
    //   storageService.setMarket(log.address, {
    //     totalCash: 1000n,
    //     totalSupply: 500n,
    //   } as MarketEntity);
    //   storageService.setAccount(log.minter, initialAccount);
    //
    //   marketService.mint(log);
    //
    //   const updatedAccount = storageService.getAccount(log.minter)!;
    //
    //   expect(updatedAccount.tokens[log.address]).toEqual(log.mintTokens);
    // });
    //
    // it('should fund account if it exists, but token is empty', () => {
    //   const log = {
    //     address: 'cToken',
    //     minter: 'minter',
    //     mintAmount: 100n,
    //     mintTokens: 10n,
    //   };
    //
    //   const initialAccount = {
    //     address: log.minter,
    //     tokens: {
    //       [log.address]: 0n,
    //     },
    //     assets: [],
    //   };
    //
    //   storageService.setMarket(log.address, {
    //     totalCash: 1000n,
    //     totalSupply: 500n,
    //   } as MarketEntity);
    //
    //   storageService.setAccount(log.minter, initialAccount);
    //
    //   marketService.mint(log);
    //
    //   const updatedAccount = storageService.getAccount(log.minter)!;
    //
    //   expect(updatedAccount.tokens[log.address]).toEqual(log.mintTokens);
    // });
  });
});
