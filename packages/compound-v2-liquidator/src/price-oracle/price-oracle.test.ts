import { beforeAll, describe, it } from 'bun:test';
import { PriceOracleService } from './price-oracle.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import MasterModule from '../master/master.module.ts';

describe('PriceOracle', () => {
  let storageService: StorageService;
  let priceOracleService: PriceOracleService;

  beforeAll(async () => {
    const masterModule = new MasterModule(undefined);
    storageService = masterModule.storageModule.getService('storageService');
    priceOracleService =
      masterModule.priceOracleModule.getService('priceOracleService');

    await storageService.initPointerHeight();
    await storageService.initTokenConfigs();
    await storageService.initMarkets();
    await storageService.initComptroller();
  });
  // const prices = {
  //   '0xb8612e326dd19fc983e73ae3bc23fa1c78a3e01478574fa7ceb5b57e589dcebd':
  //     1209463n,
  //   '0x3ec6762bdf44eb044276fec7d12c1bb640cb139cfd533f93eeebba5414f5db55':
  //     307882n,
  //   '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4':
  //     3596750000n,
  // };

  // const TokenConfig = {
  //   // cZRX - ZRX
  //   cToken: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
  //   underlying: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
  //   symbolHash:
  //     '0xb8612e326dd19fc983e73ae3bc23fa1c78a3e01478574fa7ceb5b57e589dcebd',
  //   baseUnit: 1000000000000000000n,
  //   priceSource: 2,
  //   fixedPrice: 0,
  //   uniswapMarket: '0x14424eEeCbfF345B38187d0B8b749E56FAA68539',
  //   reporter: '0x5c5db112c98dbe5977A4c37AD33F8a4c9ebd5575',
  //   reporterMultiplier: 10000000000000000n,
  //   isUniswapReversed: true,
  // };
  // const TokenConfig = {
  //   // cBAT - BAT
  //   cToken: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
  //   underlying: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  //   symbolHash:
  //     '0x3ec6762bdf44eb044276fec7d12c1bb640cb139cfd533f93eeebba5414f5db55',
  //   baseUnit: 1000000000000000000n,
  //   priceSource: 2,
  //   fixedPrice: 0,
  //   uniswapMarket: '0xae614a7a56cb79c04df2aeba6f5dab80a39ca78e',
  //   reporter: '0xeba6f33730b9751a8ba0b18d9c256093e82f6bc2',
  //   reporterMultiplier: 10000000000000000n,
  //   isUniswapReversed: false,
  // };
  // const TokenConfig = {
  //   cToken: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
  //   underlying: '0x0000000000000000000000000000000000000000',
  //   symbolHash:
  //     '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4',
  //   baseUnit: 1000000000000000000n,
  //   priceSource: 2,
  //   fixedPrice: 0,
  //   uniswapMarket: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
  //   reporter: '0x264BDDFD9D93D48d759FBDB0670bE1C6fDd50236',
  //   reporterMultiplier: 10000000000000000n,
  //   isUniswapReversed: true,
  // };

  it('should process prices from transmit/PriceUpdated/PriceGuarded', async () => {
    // const poinerHeight = storageService.getPointerHeight();
    // const logs = await priceOracleService.collectLogs(
    //   poinerHeight - 2000,
    //   poinerHeight,
    // );
    // const markets = Object.values(storageService.getMarkets());
    //
    // for (const market of markets) {
    //   const tokenConfig = storageService.getTokenConfig(market.address);
    //   const price = await priceOracleService.fetchPrice(
    //     market.underlyingSymbol,
    //   );
    //   tokenConfig.price = price;
    //
    //   console.log('tokenConfig', tokenConfig);
    //
    //   const underlyingPrice = priceOracleService.getUnderlyingPrice(
    //     tokenConfig!,
    //   );
    //
    //   const fetchedUnderlyingPrice =
    //     await priceOracleService.fetchUnderlyingPrice(market.address);
    //
    //   try {
    //     expect(underlyingPrice).toEqual(fetchedUnderlyingPrice);
    //   } catch (error) {
    //     console.log('market', market.symbol, market.address);
    //     console.error(error);
    //   }
    // }
  }, 60_000);

  it('should update price on event', async () => {
    // const pointerHeight = storageService.getPointerHeight();
    //
    // const log = {
    //   address: '0x50ce56A3239671Ab62f185704Caedf626352741e',
    //   blockNumber: pointerHeight,
    //   symbolHash:
    //     '0xe98e2830be1a7e4156d656a7505e65d08c67660dc618072422e9c78053c261e9',
    // };
    //
    // await priceOracleService.priceUpdated(log);
    //
    // const tokenConfig = storageService.getTokenConfigBySymbolHash(
    //   log.symbolHash,
    // );
    //
    // const market = storageService.getMarket(tokenConfig!.marketAddress);
    // const underlyingPrice = await priceOracleService.fetchUnderlyingPrice(
    //   market.address,
    //   pointerHeight,
    // );
    //
    // expect(market.underlyingPriceMantissa).toEqual(underlyingPrice);
  });

  it('should get all aggregatos', async () => {
    const tokenConfigs = storageService.getTokenConfigs();

    console.log('tokenConfigs', tokenConfigs);
    const aggregators = Object.values(tokenConfigs).map(
      (config) => config.aggregator,
    );

    console.log('aggregators', aggregators);
  });

  it('should calculate underlying price correct', async () => {
    // const symbolHash =
    //   '0x3ec6762bdf44eb044276fec7d12c1bb640cb139cfd533f93eeebba5414f5db55';
    //
    // const tokenConfig =
    //   storageService.getTokenConfigsBySymbolHash(symbolHash)[0];
    //
    // console.log('tokenConfig', tokenConfig);
    // const market = storageService.getMarket(tokenConfig!.marketAddress);
    //
    // const convertedPrice = priceOracleService.convertReportedPrice(
    //   tokenConfig,
    //   249087n,
    // );
    //
    // tokenConfig.price = convertedPrice;
    //
    // const underlyingPrice = BigInt(
    //   priceOracleService.getUnderlyingPrice(tokenConfig!).toString() + '00',
    // );
    //
    // const fetchedPrice = await priceOracleService.fetchUnderlyingPrice(
    //   market.address,
    //   19663245,
    // );
    //
    // expect(underlyingPrice).toEqual(fetchedPrice);
  });

  // it('should fetch token config', async () => {
  //   const symbolHash =
  //     '0x4dcbfd8d7239a822743634e138b90febafc5720cec2dbdc6a0e5a2118ba2c532';
  //   const tokenConfig = await priceOracleService.fetchTokenConfig({
  //     symbolHash,
  //   });
  //
  //   console.log('tokenConfig', tokenConfig);
  // });

  // it('should fetch token price', async () => {
  //   const tokenPrice = await priceOracleService.fetchTokenPrice(
  //     'ETH',
  //     19462205,
  //   );
  //
  //   console.log('tokenPrice', tokenPrice);
  // });

  // it('should hash event signature correctly', async () => {
  //   const eventNames = [PriceOracleEventName.PriceUpdated];
  //   const abi = (
  //     await import(
  //       '../../../../common/compound-protocol/artifacts/UniswapAnchoredView.sol/UniswapAnchoredView.json'
  //     )
  //   ).default;
  //
  //   console.log('abi', abi);
  //   const filteredAbi = filterAbi(abi, eventNames);
  //
  //   const signature = web3Service.getEventSignatureHashes(filteredAbi);
  //   console.log('signature', signature);
  // });
});
