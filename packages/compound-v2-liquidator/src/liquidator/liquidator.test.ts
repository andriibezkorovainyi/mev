import { beforeEach, describe, it } from 'bun:test';
import { LiquidatorService } from './liquidator.service.ts';
import { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { CacheService } from '../cache/cache.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import Env from '../../utils/constants/env.ts';
import { ComptrollerService } from '../comptroller/comptroller.service.ts';
import { AccountService } from '../account/account.service.ts';
import { AggregatorService } from '../aggregator/aggregator.service.ts';
import { MarketService } from '../market/market.service.ts';
import { Web3 } from 'web3';

describe('Liquidator', () => {
  let cacheService: CacheService;
  let web3Service: Web3Service;
  let storageService: StorageService;
  let priceOracleService: PriceOracleService;
  let accountService: AccountService;
  let aggregatorService: AggregatorService;
  let comptrollerService: ComptrollerService;
  let liquidatorService: LiquidatorService;
  let marketService: MarketService;

  beforeEach(async () => {
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    priceOracleService = new PriceOracleService(web3Service, storageService);
    accountService = new AccountService(storageService, web3Service);
    aggregatorService = new AggregatorService(storageService, web3Service);
    marketService = new MarketService(
      storageService,
      web3Service,
      accountService,
    );
    comptrollerService = new ComptrollerService(
      storageService,
      web3Service,
      accountService,
      priceOracleService,
      aggregatorService,
    );

    liquidatorService = new LiquidatorService(
      storageService,
      priceOracleService,
    );

    await storageService.init();

    const markets = Object.values(storageService.getMarkets());
    const pointerHeight = storageService.getPointerHeight();

    for (const market of markets) {
      market.underlyingPriceMantissa =
        await priceOracleService.fetchUnderlyingPrice(
          market.address,
          pointerHeight,
        );
      market.exchangeRateMantissa = await marketService.fetchExchangeRate(
        market.address,
        pointerHeight,
      );
    }
  });

  it('should correct hash symbol', () => {
    console.log(Web3.utils.keccak256('ETH'));
  });

  // it('should calculate account liquidity correct', async () => {
  //   const account = storageService.getAccounts().values().next()
  //     .value as AccountEntity;
  //   const pointerHeight = storageService.getPointerHeight();
  //
  //   const [sumCollateral, sumBorrow] =
  //     await liquidatorService.calculateAccountLiquidity(account.address);
  //
  //   let liquidity = 0n;
  //   let shortfall = 0n;
  //
  //   if (sumCollateral > sumBorrow) {
  //     liquidity = sumCollateral - sumBorrow;
  //   } else {
  //     shortfall = sumBorrow - sumCollateral;
  //   }
  //
  //   const fetchedAccountLiquidity =
  //     await comptrollerService.fetchAccountLiquidity(
  //       account.address,
  //       pointerHeight,
  //     );
  //
  //   expect(liquidity).toBe(fetchedAccountLiquidity['1']);
  //   expect(shortfall).toBe(fetchedAccountLiquidity['2']);
  // });
});
