import MasterModule from '../src/master/master.module.ts';
import Env from '../utils/constants/env.ts';
import { delay } from '../../../common/helpers/delay.ts';

async function updateUnderlyingPrice() {
  Env.SHOULD_FETCH_UNDERLYING_PRICE = true;

  const masterModule = new MasterModule(undefined);
  const storageService =
    masterModule.storageModule.getService('storageService');
  const priceOracleService =
    masterModule.priceOracleModule.getService('priceOracleService');

  await storageService.initComptroller();
  await storageService.initPointerHeight();
  await storageService.initMarkets();

  const pointerHeight = storageService.getPointerHeight();
  const markets = Object.values(storageService.getMarkets());

  for (const market of markets) {
    market.underlyingPriceMantissa =
      await priceOracleService.fetchUnderlyingPrice(
        market.address,
        pointerHeight,
      );

    await delay(500);
  }

  await storageService.cacheMarkets();

  console.log('Exchange rates updated');
  process.exit(1);
}

updateUnderlyingPrice();
