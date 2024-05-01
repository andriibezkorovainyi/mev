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
  let pointerHeight: number;

  beforeEach(async () => {
    // Setup your service with mocks or stubs if necessary
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);
    accountService = new AccountService(storageService, web3Service);

    // await storageService.init();
    await storageService.initPointerHeight();
    await storageService.initAccounts();
    await storageService.initMarkets();

    pointerHeight = storageService.getPointerHeight();
  });

  it('should sort collected json logs', () => {
    // const filePath = path.resolve(
    //   process.cwd(),
    //   '0xfB0018Ad46c669B6a4c0e589C53Db27daF7f7930.json',
    // );
    //
    // const logs = JSON.parse(fs.readFileSync(filePath).toString(), reviver);
    // const transformedLogs = sortLogs(logs);
    // fs.writeFileSync(filePath, JSON.stringify(transformedLogs, replacer, 2));
  });

  // it('should fetch account balance', async () => {
  //   const address = '0x4654F56a64301b9b582F843F97332D96Ead11FF8';
  //   const cToken = '0x39AA39c021dfbaE8faC545936693aC917d5E7563';
  //
  //   const snaphot = await accountService.fetchAccountTokenBalance(
  //     address,
  //     cToken,
  //     pointerHeight,
  //   );
  //
  //   console.log('snaphot', snaphot);
  // });

  it('should collect many balances correct', async () => {
    const accounts = Array.from(
      new Set(['0xFeECA8db8b5f4Efdb16BA43d3D06ad2F568a52E3']),
    ).map((address) => storageService.getAccount(address)!);

    const pointerHeight = storageService.getPointerHeight();

    let count = 50;
    for (let i = 0; i < accounts.length; i++) {
      if (count === 0) {
        break;
      }
      count -= 1;

      const account = accounts[i];
      console.log('account', account);
      const tokens = Object.entries(account.tokens);

      for (const [token, balance] of tokens) {
        // const asset = account.assets[0];
        // console.log('asset', asset);
        // const tokenBalance = tokens[0][1];
        // console.log('tokenBalance', tokenBalance);
        const fetchedBalance = await accountService.fetchAccountTokenBalance(
          account.address,
          token,
          pointerHeight,
        );

        try {
          expect(balance).toEqual(fetchedBalance);
        } catch (error) {
          console.log('cToken', token);
          console.log('account', account);
          console.log('index', i);
          console.log('tokenBalance', balance);
          console.log('fetchedBalance', fetchedBalance);
        }
      }
    }
  }, 600_000);

  it('should collect account borrows correct', async () => {
    // const accounts = Array.from(storageService.getAccounts().values());
    const accounts = Array.from(
      new Set(['0xFeECA8db8b5f4Efdb16BA43d3D06ad2F568a52E3']),
    ).map((address) => storageService.getAccount(address)!);

    let count = 15;
    for (let i = 0; i < accounts.length; i++) {
      if (count === 0) {
        break;
      }
      count -= 1;

      const account = accounts[i];
      const assets = account.assets;

      for (const asset of assets) {
        const accountBorrows = accountService.borrowBalance(asset);

        const fetchedBorrows = await accountService.fetchAccountBorrows(
          account.address,
          asset.address,
          pointerHeight,
        );

        try {
          expect(accountBorrows).toEqual(fetchedBorrows);
        } catch (e) {
          console.error(e);
          console.log('account address', account.address);
          console.log('asset', asset);
          console.log('accountBorrows', accountBorrows);
          console.log('fetchedBorrows', fetchedBorrows);
        }
      }
    }
  }, 20_000);

  // it('should correct parse account token balance', async () => {
  //   const accounts = storageService.getAccounts();
  //   const pointerHeight = storageService.getPointerHeight();
  //
  //   let count = 10;
  //   for (const [address, account] of accounts) {
  //     if (count === 0) {
  //       break;
  //     }
  //     count -= 1;
  //     const tokens = Object.entries(account.tokens);
  //     // const asset = account.assets[0];
  //     // console.log('asset', asset);
  //     const tokenBalance = tokens[0][1];
  //     // console.log('tokenBalance', tokenBalance);
  //     const fetchedBalance = await accountService.getAccountTokenBalance(
  //       account.address,
  //       tokens[0][0],
  //       pointerHeight,
  //     );
  //
  //     console.log('tokenBalance', tokenBalance);
  //     console.log('fetchedBalance', fetchedBalance);
  //     expect(tokenBalance).toEqual(fetchedBalance);
  //   }
  // });
});
