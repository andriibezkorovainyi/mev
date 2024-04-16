import { beforeEach, describe, it } from 'bun:test';
import { ComptrollerService } from './comptroller.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import Env from '../../utils/constants/env.ts';
import { StorageService } from '../storage/storage.service.ts';
import { CacheService } from '../cache/cache.service.ts';
import { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { ValidatorProxyService } from '../validator-proxy/validatorProxyService.ts';
import { AccountService } from '../account/account.service.ts';

export const comptrollerLogsMock = [
  {
    '0': '0x0000000000000000000000000000000000000000',
    '1': '0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904',
    __length__: 2,
    oldPriceOracle: '0x0000000000000000000000000000000000000000',
    newPriceOracle: '0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewPriceOracle',
    blockNumber: 7710677n,
    transactionIndex: 23,
    logIndex: 23,
  },
  {
    '0': 0n,
    '1': 500000000000000000n,
    __length__: 2,
    oldCloseFactorMantissa: 0n,
    newCloseFactorMantissa: 500000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCloseFactor',
    blockNumber: 7710677n,
    transactionIndex: 23,
    logIndex: 24,
  },
  {
    '0': '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    __length__: 1,
    cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketListed',
    blockNumber: 7710778n,
    transactionIndex: 5,
    logIndex: 3,
  },
  {
    '0': '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    __length__: 1,
    cToken: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketListed',
    blockNumber: 7710780n,
    transactionIndex: 40,
    logIndex: 15,
  },
  {
    '0': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    __length__: 1,
    cToken: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketListed',
    blockNumber: 7710782n,
    transactionIndex: 11,
    logIndex: 5,
  },
  {
    '0': '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    __length__: 1,
    cToken: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketListed',
    blockNumber: 7710784n,
    transactionIndex: 20,
    logIndex: 3,
  },
  {
    '0': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    __length__: 1,
    cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketListed',
    blockNumber: 7710786n,
    transactionIndex: 4,
    logIndex: 2,
  },
  {
    '0': '0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904',
    '1': '0x28F829F473638ba82710c8404A778f9a66029aAD',
    __length__: 2,
    oldPriceOracle: '0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904',
    newPriceOracle: '0x28F829F473638ba82710c8404A778f9a66029aAD',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewPriceOracle',
    blockNumber: 7710794n,
    transactionIndex: 61,
    logIndex: 42,
  },
  {
    '0': '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    '1': 0n,
    '2': 600000000000000000n,
    __length__: 3,
    cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    oldCollateralFactorMantissa: 0n,
    newCollateralFactorMantissa: 600000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCollateralFactor',
    blockNumber: 7710796n,
    transactionIndex: 12,
    logIndex: 13,
  },
  {
    '0': '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    '1': 0n,
    '2': 600000000000000000n,
    __length__: 3,
    cToken: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    oldCollateralFactorMantissa: 0n,
    newCollateralFactorMantissa: 600000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCollateralFactor',
    blockNumber: 7710797n,
    transactionIndex: 29,
    logIndex: 24,
  },
  {
    '0': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    '1': 0n,
    '2': 750000000000000000n,
    __length__: 3,
    cToken: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    oldCollateralFactorMantissa: 0n,
    newCollateralFactorMantissa: 750000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCollateralFactor',
    blockNumber: 7710798n,
    transactionIndex: 10,
    logIndex: 10,
  },
  {
    '0': '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    '1': 0n,
    '2': 600000000000000000n,
    __length__: 3,
    cToken: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    oldCollateralFactorMantissa: 0n,
    newCollateralFactorMantissa: 600000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCollateralFactor',
    blockNumber: 7710800n,
    transactionIndex: 21,
    logIndex: 14,
  },
  {
    '0': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    '1': 0n,
    '2': 750000000000000000n,
    __length__: 3,
    cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    oldCollateralFactorMantissa: 0n,
    newCollateralFactorMantissa: 750000000000000000n,
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'NewCollateralFactor',
    blockNumber: 7710801n,
    transactionIndex: 44,
    logIndex: 25,
  },
  {
    '0': '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    '1': '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    __length__: 2,
    cToken: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    account: '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711094n,
    transactionIndex: 33,
    logIndex: 66,
  },
  {
    '0': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    '1': '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    __length__: 2,
    cToken: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    account: '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711094n,
    transactionIndex: 33,
    logIndex: 67,
  },
  {
    '0': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    '1': '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    __length__: 2,
    cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    account: '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711094n,
    transactionIndex: 33,
    logIndex: 68,
  },
  {
    '0': '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    '1': '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    __length__: 2,
    cToken: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    account: '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711094n,
    transactionIndex: 33,
    logIndex: 69,
  },
  {
    '0': '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    '1': '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    __length__: 2,
    cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    account: '0x502CB8985B2C92a8d4bf309cDAa89DE9be442708',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711094n,
    transactionIndex: 33,
    logIndex: 70,
  },
  {
    '0': '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    '1': '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    __length__: 2,
    cToken: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    account: '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711131n,
    transactionIndex: 98,
    logIndex: 76,
  },
  {
    '0': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    '1': '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    __length__: 2,
    cToken: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    account: '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711131n,
    transactionIndex: 98,
    logIndex: 77,
  },
  {
    '0': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    '1': '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    __length__: 2,
    cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    account: '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711131n,
    transactionIndex: 98,
    logIndex: 78,
  },
  {
    '0': '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    '1': '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    __length__: 2,
    cToken: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    account: '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711131n,
    transactionIndex: 98,
    logIndex: 79,
  },
  {
    '0': '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    '1': '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    __length__: 2,
    cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    account: '0xA7ff0d561cd15eD525e31bbe0aF3fE34ac2059F6',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711131n,
    transactionIndex: 98,
    logIndex: 80,
  },
  {
    '0': '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    '1': '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    __length__: 2,
    cToken: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    account: '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711211n,
    transactionIndex: 29,
    logIndex: 13,
  },
  {
    '0': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    '1': '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    __length__: 2,
    cToken: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    account: '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711211n,
    transactionIndex: 29,
    logIndex: 14,
  },
  {
    '0': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    '1': '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    __length__: 2,
    cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    account: '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711211n,
    transactionIndex: 29,
    logIndex: 15,
  },
  {
    '0': '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    '1': '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    __length__: 2,
    cToken: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    account: '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711211n,
    transactionIndex: 29,
    logIndex: 16,
  },
  {
    '0': '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    '1': '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    __length__: 2,
    cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    account: '0xC8355D0E2C265B2Fe495EbBC0fc9AD992B40DC8F',
    address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    eventName: 'MarketEntered',
    blockNumber: 7711211n,
    transactionIndex: 29,
    logIndex: 17,
  },
];

describe('Comptroller', () => {
  let cacheService: CacheService;
  let storageService: StorageService;
  let web3Service: Web3Service;
  let accountService: AccountService;
  let pticeOracleService: PriceOracleService;
  let aggregatorService: ValidatorProxyService;
  let comptrollerService: ComptrollerService;

  beforeEach(async () => {
    cacheService = new CacheService();
    storageService = new StorageService(cacheService);
    web3Service = new Web3Service(Env.HTTPS_RPC_URL);
    accountService = new AccountService(storageService, web3Service);
    pticeOracleService = new PriceOracleService(web3Service, storageService);
    aggregatorService = new ValidatorProxyService(storageService, web3Service);

    comptrollerService = new ComptrollerService(
      storageService,
      web3Service,
      accountService,
      pticeOracleService,
      aggregatorService,
    );

    await storageService.initComptroller();
  });

  it('should create market and tokenConfig by cToken', async () => {
    const comptroller = storageService.getComptroller();
    console.log(
      'liquidationIncentive',
      comptroller.liquidationIncentiveMantissa! / BigInt(1e18),
    );
    // const cToken = '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407';
    //
    // const market = await comptrollerService.createMarket(cToken);
    // const tokenConfgs = storageService.getTokenConfigs();
    //
    // console.log('market', market, 'tokenConfigs', tokenConfgs);
  });

  // it('should create market from log', async () => {
  //   const marketListedLog = comptrollerLogsMock.find(
  //     (item) => item.eventName === 'MarketListed',
  //   );
  //
  //   await comptrollerService.marketListed(marketListedLog);
  //
  //   const markets = storageService.getMarkets();
  //   const tokenConfigs = storageService.getTokenConfigs();
  //
  //   expect(markets).toBeObject();
  //   expect(tokenConfigs).toBeObject();
  //
  //   console.log('markets', markets, 'tokenConfigs', tokenConfigs);
  // });
});
