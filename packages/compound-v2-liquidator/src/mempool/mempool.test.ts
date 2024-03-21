import { beforeEach, describe, expect, it } from 'bun:test';
import { MempoolService } from './mempool.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import Env from '../../utils/constants/env.ts';
import txTest from './tx.test';
import { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { CacheService } from '../cache/cache.service.ts';

describe('Mempool', () => {
  let mempoolService: MempoolService;
  let cacheService: CacheService;
  let web3Service: Web3Service;
  let storageService: StorageService;
  let priceOracleService: PriceOracleService;
  const txInput = txTest.input;
  const txHash =
    '0x5de9fe183d2046c01d19ea1771960597a1e1c39ef1dbd87f2151f5b0e46902ed';

  const tokenConfigs = {
    '0xb8612e326dd19fc983e73ae3bc23fa1c78a3e01478574fa7ceb5b57e589dcebd': {
      marketAddress: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
      baseUnit: 1000000000000000000n,
      priceSource: 2,
      fixedPrice: 0n,
      reporterMultiplier: 10000000000000000n,
      reporter: '0x5c5db112c98dbe5977A4c37AD33F8a4c9ebd5575',
      aggregator: '0x4Dde220fF2690A350b0Ea9404F35C8f3Ad012584',
    },
  };

  beforeEach(() => {
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    priceOracleService = new PriceOracleService(web3Service, storageService);

    mempoolService = new MempoolService(
      storageService,
      web3Service,
      priceOracleService,
    );

    const values = Object.values(tokenConfigs);

    mempoolService.tokenConfigs = Object.fromEntries(
      values.map((value) => {
        return [value.aggregator, value];
      }),
    );
  });

  // it('should decode report from Input', async () => {
  //   const report = mempoolService.decodeReport(txInput);
  //
  //   console.log(report);
  // });

  // it('should parse observations from report', async () => {
  //   const report = mempoolService.decodeReport(txInput) as string;
  //   const observations = mempoolService.parseObservations(report);
  //
  //   // expect(observations).toBeArray();
  //   console.log(observations[15]);
  // });

  it('should parse median correct', async () => {
    const validatedAnswer = await mempoolService.processTx(txHash);

    expect(validatedAnswer).toBeDefined();

    console.log(validatedAnswer);

    // const updatedPrice = await priceOracleService.fetchTokenPrice(
    //   Object.keys(tokenConfigs)[0],
    //   19469068,
    // );
    //
    // expect(updatedPrice).toBeDefined();
    //
    // expect(validatedAnswer).toBe(updatedPrice);
  });
});
