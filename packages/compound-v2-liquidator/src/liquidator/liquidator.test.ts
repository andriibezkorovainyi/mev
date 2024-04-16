import { beforeAll, describe, expect, it } from 'bun:test';
import { LiquidatorService } from './liquidator.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { ComptrollerService } from '../comptroller/comptroller.service.ts';
import { AccountService } from '../account/account.service.ts';
import MasterModule from '../master/master.module.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import type { BundleService } from '../bundle/bundle.service.ts';
import type { MarketService } from '../market/market.service.ts';

describe('Liquidator', () => {
  let storageService: StorageService;
  let accountService: AccountService;
  let comptrollerService: ComptrollerService;
  let liquidatorService: LiquidatorService;
  let marketService: MarketService;
  let bundleService: BundleService;
  let priceOracleService: PriceOracleService;
  let pointerHeight: number;
  const deployer = {
    address: '0x4A4F8BE8217BC82588383AC91bad9B3aB34F345f',
    private: '134478bbe70edcfc0f98cf76d49c8262b36ad96c28061d0acdd0bd2a31901fb3',
  };

  beforeAll(async () => {
    const masterModule = new MasterModule(undefined as unknown as Worker);
    storageService = masterModule.storageModule.getService('storageService');
    liquidatorService =
      masterModule.liquidatorModule.getService('liquidatorService');
    comptrollerService =
      masterModule.comptrollerModule.getService('comptrollerService');
    accountService = masterModule.accountModule.getService('accountService');
    priceOracleService =
      masterModule.priceOracleModule.getService('priceOracleService');
    bundleService = masterModule.bundleModule.getService('bundleService');
    marketService = masterModule.marketModule.getService('marketService');

    await storageService.init();
    pointerHeight = storageService.getPointerHeight();
  });

  it('should update market exchange rates and underlying prices', async () => {
    //   const markets = Object.values(storageService.getMarkets());
    //
    //   for (const market of markets) {
    //     const underlyingPrice = await priceOracleService.fetchUnderlyingPrice(
    //       market.address,
    //       pointerHeight,
    //     );
    //     const exchangeRate = await marketService.fetchExchangeRateMantissa(
    //       market.address,
    //       pointerHeight,
    //     );
    //     market.underlyingPriceMantissa = underlyingPrice;
    //     market.exchangeRateMantissa = exchangeRate;
    //     await delay(500);
    //   }
    // }, 60_000);
    //
    // it('should process pending price update', async () => {
    //   spyOn(bundleService, 'submitBundleBLXR').mockReturnValue(
    //     Promise.resolve(() => {
    //       console.log('mocked bundle hash');
    //     }),
    //   );
    //   const symbolHash = EthSymbolHash;
    //   // '0xec34391362c28ee226b3b8624a699ee507a40fa771fd01d38b03ac7b70998bbe';
    //
    //   const tokenConfig = storageService.getTokenConfigsBySymbolHash(symbolHash)!;
    //   // tokenConfig.price = 6704260000n;
    //
    //   await liquidatorService.processPendingPriceUpdate({
    //     type: MessageType.pendingPriceUpdate,
    //     data: [tokenConfig, 'abb'],
    //   });
  }, 10000);

  it('should calculate repayAmount as maxClose if collateralAmount > maxClose', async () => {
    // const account = accountBiggestCollateralGreaterThenBorrowMaxClose;
    //
    // const comptroller = storageService.getComptroller();
    //
    // const cTokenCollateral =
    //   liquidatorService.findCollateralToLiquidate(account);
    //
    // const cTokenBorrowed = liquidatorService.findBorrowToLiquidate(account);
    //
    // const marketBorrowed = storageService.getMarket(cTokenBorrowed.address);
    //
    // const repayAmount = liquidatorService.calculateRepayAmount(
    //   cTokenBorrowed,
    //   cTokenCollateral,
    // );
    //
    // const maxCloseAmount = div_MantissaB(
    //   mul_Mantissa(cTokenBorrowed.borrowValue, comptroller.closeFactorMantissa),
    //   marketBorrowed.underlyingPriceMantissa,
    // );
    //
    // expect(repayAmount).toBe(maxCloseAmount);
  });

  it('should calculate repayAmount as near of total collateral if it is less then maxClose', async () => {
    // const account = storageService.getAccount(deployer.address)!;
    //
    // const cTokenBorrowed = liquidatorService.findBorrowToLiquidate(account);
    //
    // const cTokenCollateral =
    //   liquidatorService.findCollateralToLiquidate(account);
    // console.log('cTokenCollateral', cTokenCollateral);
    //
    // const repayAmount = liquidatorService.calculateRepayAmount(
    //   cTokenBorrowed,
    //   cTokenCollateral,
    // );
    // console.log('repayAmount', repayAmount);
    //
    // const seizeTokens = liquidatorService.calculateSeizeTokens(
    //   cTokenBorrowed.address,
    //   cTokenCollateral.address,
    //   repayAmount,
    // );
    // console.log('seizeTokens', seizeTokens);
    //
    // const difference = Object.values(account.tokens)[0] - seizeTokens;
    //
    // console.log('difference', difference);
    // expect(difference).toBeGreaterThan(100n);
  });

  it('should find liquidation loop data', async () => {
    // const account = storageService.getAccount(
    //   '0x00641Ed1aAE8A9700fD3FD4D899F2577D1Ae6b22',
    // )!;
    //
    // console.log('account', account);
    // const symbolHash =
    //   '0xec34391362c28ee226b3b8624a699ee507a40fa771fd01d38b03ac7b70998bbe';
    // const tokenConfig = storageService.getTokenConfigBySymbolHash(symbolHash)!;
    // const market = storageService.getMarket(tokenConfig.marketAddress)!;
    //
    // // console.log('market', market.address);
    // market.underlyingPriceMantissa =
    //   priceOracleService.getUnderlyingPrice(tokenConfig);
    //
    // const [liquidity, shortfall] =
    //   liquidatorService.calculateAccountLiquidity(account);
    //
    // // console.log('liquidity', liquidity);
    // // console.log('shortfall', shortfall);
    //
    // if (liquidity > 0n) {
    //   return;
    // }
    //
    // const liquidationData = liquidatorService.searchLiquidationLoop(
    //   account,
    //   liquidity,
    // );
    //
    // console.log('liquidationData', liquidationData);
    // console.log('accountAfter', accountAfter);
  });

  it('should calculate many accounts liquidity correct', async () => {
    const accounts = Array.from(
      new Set([
        '0xE00d58e8A4850f231c8482681657501D0e49703b',
        '0xE692840875B84BFFC7402bD199D615d7Af57e1cd',
        '0x9881565CD25dAc0174f3F5706842D7041999BF08',
        '0x56c8490dd7F1b4a4b972A35cA8B31Fb23641a0EF',
        '0xdce673f13d5AA11c7089C99b7342580108Af2D25',
        '0xdce673f13d5AA11c7089C99b7342580108Af2D25',
        '0x9BEbC5bCea7c5fe51AAA33D25B8Bc832C6feef16',
        '0x9BEbC5bCea7c5fe51AAA33D25B8Bc832C6feef16',
        '0x5BDb04e9C760123f40512EE46b672577C0bD4905',
        '0xB9988c00739E59B80fF8ddc61f00fdC7e7C84688',
        '0x2CA86Ebeb6F53753696af6ca03E13F4751636828',
        '0x1F3E33141308E0A847655CAdBC55613232cc3DFB',
      ]),
    ).map((address) => storageService.getAccount(address)!);

    // const marketWithWrongUnderlyingPrice = storageService.getMarket(
    //   '0xccF4429DB6322D5C611ee964527D42E5d685DD6a',
    // )!;

    // marketWithWrongUnderlyingPrice.underlyingPriceMantissa =
    //   213102633260000000000000000000000n;

    // console.log('accounts', accounts.length);

    // let count = 15;
    for (let i = 0; i < accounts.length; i++) {
      // if (count === 0) {
      //   break;
      // }
      const account = accounts[i];
      // console.log('account', account);
      // const marketAddresses = account.assets.map((asset) => asset.address);
      // const markets = Object.values(storageService.getMarkets()).filter(
      //   (market) => marketAddresses.includes(market.address),
      // );

      // console.log('markets', markets);

      const [liquidity, shortfall] =
        liquidatorService.calculateAccountLiquidity(account);

      const fetchedAccountLiquidity =
        await comptrollerService.fetchAccountLiquidity(
          account.address,
          pointerHeight,
        );

      try {
        expect(liquidity).toBe(fetchedAccountLiquidity['1']);
        expect(shortfall).toBe(fetchedAccountLiquidity['2']);
      } catch (e: unknown) {
        console.log('account address', account.address);
        console.log('liquidity', liquidity);
        console.log('shortfall', shortfall);
        console.error(e);
      }
      // count--;
    }
  }, 60_000);

  it('should calculate account liquidity correct', async () => {
    // const market = storageService.getMarketsBySymbolHash(EthSymbolHash)[0];
    // const allowedMarkets = [
    //   '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    //   '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    //   '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    //   '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9',
    //   '0xccF4429DB6322D5C611ee964527D42E5d685DD6a',
    //   '0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b',
    // ];
    //
    // const accounts = storageService.getAccounts().values();
    //
    // for (const account of accounts) {
    //   const [liquidity, shortfall] =
    //     liquidatorService.calculateAccountLiquidity(account);
    //
    //   if (liquidity > 0n) {
    //     continue;
    //   }
    //
    //   const borrow = liquidatorService.findBorrowToLiquidate(account);
    //
    //   if (!allowedMarkets.includes(borrow.address)) {
    //     continue;
    //   }
    //
    //   const collateral = liquidatorService.findCollateralToLiquidate(account);
    //
    //   if (
    //     Math.round(Number(collateral.collateralValue) / 1e18) <
    //     Env.MINIMUM_LIQUIDATION_VALUE
    //   ) {
    //     continue;
    //   }
    //
    //   const repayAmount = liquidatorService.calculateRepayAmount(
    //     borrow,
    //     collateral,
    //   );
    //
    //   const repayToken = storageService.getMarket(
    //     borrow.address,
    //   )!.underlyingAddress;
    //   console.log('repayToken', repayToken);
    //   console.log('repayAmount', repayAmount);
    //   console.log('cMarket', borrow.address);
    //   console.log('_cMarketCollateral', collateral.address);
    //   console.log('borrower', account.address);
    //
    //   break;
    // }
  }, 10_000);

  it('should calculate account liquidity correct', async () => {
    // // await cacheService.cacheClear();
    // await storageService.init();
    // // await collectorService.collectPastEvents();
    //
    // const account = storageService.getAccount(
    //   '0x4A4F8BE8217BC82588383AC91bad9B3aB34F345f',
    // )!;
    //
    // console.log(account);
    // const accountBorrowBalance = accountService.borrowBalance(
    //   account.assets[1],
    // );
    //
    // console.log('accountBorrowBalance', accountBorrowBalance);
    // //
    // // console.log(account);
    // //
    // // const pointerHeight = storageService.getPointerHeight();
    // const collateralMarket = storageService.getMarket(
    //   '0xD6cE77ffA909180bD2C26f248e88693bEfDB5A64',
    // );
    // const borrowMarket = storageService.getMarket(
    //   '0xfB8FAf9784b93290FdDF8593b594E16BB7790Afd',
    // );
    //
    // console.log('collateralMarket', collateralMarket);
    // console.log('borrowMarket', borrowMarket);
    //
    // const [sumCollateral, sumBorrow] =
    //   service.calculateAccountLiquidity(account);
    //
    // let liquidity = 0n;
    // let shortfall = 0n;
    //
    // if (sumCollateral > sumBorrow) {
    //   liquidity = sumCollateral - sumBorrow;
    // } else {
    //   shortfall = sumBorrow - sumCollateral;
    // }
    //
    // console.log('liquidity', liquidity);
    // console.log('shortfall', shortfall);
    // const fetchedAccountLiquidity =
    //   await comptrollerService.fetchAccountLiquidity(
    //     account.address,
    //     pointerHeight,
    //   );
    //
    // expect(liquidity).toBe(fetchedAccountLiquidity['1']);
    // expect(shortfall).toBe(fetchedAccountLiquidity['2']);
  });
});
