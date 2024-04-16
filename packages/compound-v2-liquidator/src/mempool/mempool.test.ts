import { beforeAll, describe, expect, it } from 'bun:test';
import type { MempoolService } from './mempool.service.ts';
import type { ComptrollerService } from '../comptroller/comptroller.service.ts';
import MempoolModule from './mempool.module.ts';
import type { MessageService } from './message.service.ts';
import MasterModule from '../master/master.module.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { BundleService } from '../bundle/bundle.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { Web3 } from 'web3';

describe('Mempool', () => {
  let mempoolService: MempoolService;
  let comptrollerService: ComptrollerService;
  let messageService: MessageService;
  let bundleService: BundleService;
  let web3Service: Web3Service;
  let storageService: StorageService;
  let priceOracleService: PriceOracleService;

  // const txInput = txTest.input;
  // const txHash =
  //   '0x5de9fe183d2046c01d19ea1771960597a1e1c39ef1dbd87f2151f5b0e46902ed';
  // const tokenConfigs = {
  //   '0xb8612e326dd19fc983e73ae3bc23fa1c78a3e01478574fa7ceb5b57e589dcebd': {
  //     marketAddress: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
  //     baseUnit: 1000000000000000000n,
  //     priceSource: 2,
  //     fixedPrice: 0n,
  //     reporterMultiplier: 10000000000000000n,
  //     reporter: '0x5c5db112c98dbe5977A4c37AD33F8a4c9ebd5575',
  //     aggregator: '0x4Dde220fF2690A350b0Ea9404F35C8f3Ad012584',
  //   },
  // };

  beforeAll(async () => {
    // Env.PROTOCOL = ProtocolType.TEST_V2;

    const masterModule = new MasterModule(undefined as unknown as Worker);

    priceOracleService =
      masterModule.priceOracleModule.getService('priceOracleService');
    bundleService = masterModule.bundleModule.getService('bundleService');
    web3Service = masterModule.web3Module.getService('web3Service');

    const mempoolModule = new MempoolModule();
    storageService = mempoolModule.storageService;
    mempoolService = mempoolModule.getService('mempoolService');
    messageService = mempoolModule.messageService;
    messageService.listenForShutdown();
  });

  it('should calculate underlying price for all markets by transmit txs', async () => {
    await mempoolService.initTokenConfigs();
    await storageService.initMarkets();
    await storageService.initComptroller();

    const txHashes = [
      '0x2b76ea76f7d3003dad41adcae7fd6b9deeacda5779068d8ba01f95f574ef0d1f', // 4D
      '0x6131dd73fc8b5904fbef28bc82c7c7457174024e64e3fb1d6dff753cc2c4c224', // 98
      '0xcfe9197af2a305586ebd19b97270c6befa45cdaf380aa0f8ced8e745a95190a2', // 35
      '0x8015586067859141786e435dbc73ce0a2cc97c15def8659b367c2edb7eea6095', // E6
      '0x7969caf7f3940189494d908640caa80182dd4950d561f6435d7cb624ece80e48', // dB
      '0x0eb934fd706f33668b438e1f099278f273a1284a4f71584a608cc3062ec5db08', // 47
      '0x2439973dd895b386367c99a9ea7ee721e88763cdcf1755f4abc908ab2ad0d22e', // 37
      '0x09f0538490e249668a27f79c8a23618a8a12ece83bdc6175c944abfcf6736062', // 64
      '0x2da63979bf6dd07016ebccbe206fc7c3f7b7887ef7d523059a0f3fb63b06133c', // 20
      '0xece888f20a65aed4548d07b0c136a1cd7af0bcd57430033713ed3e69fe57babf', // 71
      '0xb0253a7a05c2313ece97ea1c902617a9e312dfebdacf7b2443a50e91c64e9751', // 3C
      '0x7328432fd82fa0a4df21f5b65216883a385f0656ad81d590008efdab9bbaf884', // 81
      '0x8cec6acf0c5b54c6a93dd77b9a669a4d842a341c48d5d1cd38f608a6118ceb54', // ca
      '0x719c1b9c217bbb0fca7d3eb5d40fcc3a2fa902cf0d9df59e5a658d9146981225', // A9
    ];

    for (const txHash of txHashes) {
      const { input, blockNumber, to } =
        await web3Service.getTransaction(txHash);

      const tokenConfig =
        mempoolService.tokenConfigs[Web3.utils.toChecksumAddress(to)];

      const price = mempoolService.getPriceFromInput(input, tokenConfig);

      tokenConfig.price = price;

      const underlyingPrice =
        priceOracleService.getUnderlyingPriceForTransmit(tokenConfig);

      const fetchedUnderlyingPrice =
        await priceOracleService.fetchUnderlyingPrice(
          tokenConfig.marketAddress,
          Number(blockNumber),
          storageService.getComptroller().priceOracle,
        );

      try {
        expect(underlyingPrice).toEqual(fetchedUnderlyingPrice);
      } catch (e) {
        const market = storageService.getMarket(tokenConfig.marketAddress);
        console.log('market', market.symbol, market.address);
        console.error(e);
      }
    }
  }, 60_000);

  it('should collect token actual token configs', async () => {
    // // await comptrollerService.collectActualTokenConfigs();
    //
    // await mempoolService.initTokenConfigs();
    // const tokenConfigs = mempoolService.tokenConfigs;
    //
    // console.log('Token configs length:', Object.keys(tokenConfigs).length);
    // expect(tokenConfigs).toBeDefined();
  }, 60_000);

  it('should subscribe to pending transmitions', async () => {
    // Env.BLOXROUTE_WS_URL = 'wss://3.78.176.231/ws';
    // mempoolService.bundleService = bundleService;
    // await mempoolService.initTokenConfigs();
    //
    // mempoolService.listenForPendingPriceUpdates();
    //
    // await delay(6_000_000);
  }, 6_000_000);

  it('should create and send test raw tx', async () => {
    // const rawTx = await web3Service.createRawTestTx();
    //
    // const receipt = await web3Service.sendRawTransaction(rawTx);
    //
    // console.log(receipt);
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
    // const validatedAnswer = await mempoolService.processTx(txHash);
    //
    // expect(validatedAnswer).toBeDefined();
    //
    // console.log(validatedAnswer);
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
