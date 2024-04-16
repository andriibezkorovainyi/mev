import { Web3Service } from '../web3/web3.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { beforeEach, describe, expect, it } from 'bun:test';
import Env from '../../utils/constants/env.ts';
import { CacheService } from '../cache/cache.service.ts';
import { PriceSource } from '../price-oracle/price-oracle.constants.ts';
import { ValidatorProxyService } from './validator-proxy.service.ts';

describe('AggregatorService', () => {
  let service: ValidatorProxyService;
  let web3Service: Web3Service;
  let cacheService: CacheService;
  let storageService: StorageService;

  const tokenConfig = {
    marketAddress: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    symbolHash:
      '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4',
    baseUnit: 1000000000000000000n,
    priceSource: PriceSource.REPORTER,
    fixedPrice: 0n,
    uniswapMarket: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
    reporter: '0x264BDDFD9D93D48d759FBDB0670bE1C6fDd50236',
    reporterMultiplier: 10000000000000000n,
  };

  beforeEach(() => {
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);

    service = new ValidatorProxyService(storageService, web3Service);
  });

  it('should fetch aggregator successfully', async () => {
    const aggregator = await service.fetchAggregator(tokenConfig.reporter);

    expect(aggregator).toBeString();
  });

  it('should create aggregator successfully', async () => {
    const aggregator = await service.createAggregator(tokenConfig);

    expect(aggregator).toBeObject();
  });

  // it('should handle error when creating aggregator', async () => {
  //   when(web3Service.callContractMethod(anything())).thenReject(
  //     new Error('Error'),
  //   );
  //   await expect(
  //     service.createAggregator(instance(tokenConfig)),
  //   ).rejects.toThrow('Error');
  //   verify(web3Service.callContractMethod(anything())).once();
  // });
  //
  // it('should fetch aggregator successfully', async () => {
  //   when(web3Service.callContractMethod(anything())).thenResolve('aggregator');
  //   await service.fetchAggregator('reporter');
  //   verify(web3Service.callContractMethod(anything())).once();
  // });
  //
  // it('should handle error when fetching aggregator', async () => {
  //   when(web3Service.callContractMethod(anything())).thenReject(
  //     new Error('Error'),
  //   );
  //   await expect(service.fetchAggregator('reporter')).rejects.toThrow('Error');
  //   verify(web3Service.callContractMethod(anything())).once();
  // });
});
