import type { AccountService } from '../../src/account/account.service.ts';
import type { MempoolService } from '../../src/mempool/mempool.service.ts';
import type { WorkerService } from '../../src/worker/worker.service.ts';
import type { MasterService } from '../../src/master/master.service.ts';
import type { CollectorService } from '../../src/collector/collector.service.ts';
import type { StorageService } from '../../src/storage/storage.service.ts';
import type { CacheService } from '../../src/cache/cache.service.ts';
import type { Web3Service } from '../../src/web3/web3.service.ts';
import type { ComptrollerService } from '../../src/comptroller/comptroller.service.ts';
import type { MarketService } from '../../src/market/market.service.ts';
import type { PriceOracleService } from '../../src/price-oracle/price-oracle.service.ts';
import type { AggregatorService } from '../../src/aggregator/aggregator.service.ts';
import type { LiquidatorService } from '../../src/liquidator/liquidator.service.ts';

export type ServiceIdentifier =
  | 'liquidatorService'
  | 'aggregatorService'
  | 'priceOracleService'
  | 'interestRateModelService'
  | 'workerService'
  | 'marketService'
  | 'comptrollerService'
  | 'accountService'
  | 'web3Service'
  | 'mempoolService'
  | 'masterService'
  | 'collectorService'
  | 'storageService'
  | 'cacheService';

export interface ServiceMapping {
  liquidatorService: LiquidatorService;
  aggregatorService: AggregatorService;
  priceOracleService: PriceOracleService;
  workerService: WorkerService;
  marketService: MarketService;
  comptrollerService: ComptrollerService;
  mempoolService: MempoolService;
  masterService: MasterService;
  collectorService: CollectorService;
  storageService: StorageService;
  cacheService: CacheService;
  web3Service: Web3Service;
  accountService: AccountService;
}
