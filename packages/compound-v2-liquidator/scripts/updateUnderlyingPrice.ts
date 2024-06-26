import MasterModule from '../src/master/master.module.ts';
import Env from '../utils/constants/env.ts';
import { delay } from '../../../common/helpers/delay.ts';

async function updateUnderlyingPrice() {
  Env.SHOULD_FETCH_UNDERLYING_PRICE = true;
  Env.SHOULD_FETCH_UNDERLYING_PRICE = true;

  const masterModule = new MasterModule(undefined);
  const storageService =
    masterModule.storageModule.getService('storageService');
  const priceOracleService =
    masterModule.priceOracleModule.getService('priceOracleService');
  const marketService = masterModule.marketModule.getService('marketService');
  await storageService.initComptroller();
  await storageService.initPointerHeight();
  await storageService.initMarkets();

  const pointerHeight = storageService.getPointerHeight();
  const markets = Object.values(storageService.getMarkets());

  for (const market of markets) {
    const underlyingPrice = await priceOracleService.fetchUnderlyingPrice(
      market.address,
      pointerHeight,
    );
    await marketService.updateUnderlyingPrice(
      market.address,
      underlyingPrice,
      pointerHeight,
    );

    await delay(500);
  }

  await storageService.cacheMarkets();

  console.log('Underlying prices updated');
  process.exit(1);
}

updateUnderlyingPrice();
