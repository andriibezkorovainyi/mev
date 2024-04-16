import MasterModule from '../src/master/master.module.ts';
import Env from '../utils/constants/env.ts';
import { delay } from '../../../common/helpers/delay.ts';

async function updateExchangeRates() {
  Env.SHOULD_FETCH_EXCHANGE_RATES = true;

  const masterModule = new MasterModule(undefined);
  const storageService =
    masterModule.storageModule.getService('storageService');
  const marketService = masterModule.marketModule.getService('marketService');

  await storageService.initMarkets();
  await storageService.initPointerHeight();

  const pointerHeight = storageService.getPointerHeight();
  const markets = Object.values(storageService.getMarkets());

  for (const market of markets) {
    market.exchangeRateMantissa = await marketService.fetchExchangeRateMantissa(
      market.address,
      pointerHeight,
    );
    market.exchangeRateLastUpdateBlock = pointerHeight;

    await delay(500);
  }

  await storageService.cacheMarkets();

  console.log('Exchange rates updated');
  process.exit(1);
}

updateExchangeRates();
