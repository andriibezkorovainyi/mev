import { beforeAll, describe, it } from 'bun:test';
import { MasterService } from './master.service.ts';
import { CollectorService } from '../collector/collector.service.ts';
import { StorageService } from '../storage/storage.service.ts';
import { Web3Service } from '../web3/web3.service.ts';
import { CacheService } from '../cache/cache.service.ts';
import { ComptrollerService } from '../comptroller/comptroller.service.ts';
import { MarketService } from '../market/market.service.ts';
import { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { ValidatorProxyService } from '../validator-proxy/validator-proxy.service.ts';
import { AccountService } from '../account/account.service.ts';
import ERC20 from '../../../../common/compound-protocol/artifacts/ERC20.sol/ERC20.json';
import CErc20 from '../../../../common/compound-protocol/artifacts/CErc20.sol/CErc20.json';
import Comptroller from '../../../../common/compound-protocol/artifacts/Comptroller.sol/Comptroller.json';
import { LiquidatorService } from '../liquidator/liquidator.service.ts';
import MasterModule from './master.module.ts';
import type { WorkerService } from '../worker/worker.service.ts';

const maxUint256 = BigInt(2) ** BigInt(256) - 1n;
const deployer = {
  address: '0x4A4F8BE8217BC82588383AC91bad9B3aB34F345f',
  private: '134478bbe70edcfc0f98cf76d49c8262b36ad96c28061d0acdd0bd2a31901fb3',
};

const account1 = {
  address: '0x7014852D523d70Dd671cbcb1841Fbd6710906725',
  private: 'c3e50fa2035cf3c1d2d212984b790bbd2fa0ae160c730bc97886f2ce06f8fccb',
};

const account2 = {
  address: '0xce1975c8d7A9d281907dE1A53D3d50CefA082560',
  private: 'eab9e1b4b31979c4af5b943a40303ff54c11a9fe2f73d9c576c8d6e060b037e8',
};

const comptroller = '0xeD1be65B71ec045D14232C6ed80BDA227DB6F4f7';
const interestRateModel = '0xD74cBD6A2564275cD93a101Dc2b2A047a7362CF6';
const oracle = '0x16eCC704D4288BB0fb71f1eA11e7670b374F1a79';
const wBTC = '0x922684dc03C9DDEdcF4661b8d0B612B3a112eCd3';
const USDT = '0x4A0B2AC95cF18d7C7b3a2D1b15850ac53b28f5F8';
const cwBTC = '0xD6cE77ffA909180bD2C26f248e88693bEfDB5A64';
// const newcwBTC = '0xf65221231f7FaeC983156E62E29c523C62c63C03';
const cUSDT = '0xfB8FAf9784b93290FdDF8593b594E16BB7790Afd';

describe('Master', () => {
  let masterService: MasterService;
  let collectorService: CollectorService;
  let storageService: StorageService;
  let web3Service: Web3Service;
  let workerService: WorkerService;
  let cacheService: CacheService;
  let comptrollerService: ComptrollerService;
  let marketService: MarketService;
  let priceOracleService: PriceOracleService;
  let validatorProxyService: ValidatorProxyService;
  let accountService: AccountService;
  let liquidatorService: LiquidatorService;

  beforeAll(() => {
    // Env.UNITROLLER_DEPLOYMENT_BLOCK = 5538416;
    // Env.COMPTROLLER_PROXY_ADDRESS =
    //   '0xeD1be65B71ec045D14232C6ed80BDA227DB6F4f7';
    // Env.HTTPS_RPC_URL =
    //   'https://eth-sepolia.g.alchemy.com/v2/dVu29ThRB_J02AW-8I0JSO42n3epUG5b';
    //
    // Env.WSS_RPC_URL =
    //   'wss://eth-sepolia.g.alchemy.com/v2/dVu29ThRB_J02AW-8I0JSO42n3epUG5b';
    //
    // Env.PROTOCOL = ProtocolType.TEST_V1;

    const mempoolWorker = new Worker('workers/mempool.worker.ts');
    const masterModule = new MasterModule(mempoolWorker);
    storageService = masterModule.storageModule.getService('storageService');
    masterService = masterModule.getService('masterService');
    workerService = masterModule.workerModule.getService('workerService');
    masterService.listenForShutdown();
  });

  describe('Main functionality', async () => {
    it('should emit pending price update', async () => {
      // workerService.init();
      //
      // await delay(600_000);
    }, 600_000);

    it('should ', async () => {
      await storageService.initTokenConfigs();
      await storageService.initMarkets();
      const tokenConfigs = storageService.getTokenConfigs();
      const markets = storageService.getMarkets();
      console.log('tokenConfigsCount', Object.values(tokenConfigs).length);
      console.log('marketsCount', Object.values(markets).length);
    }, 600_000);
  });

  describe('deployer -> priceOracle', () => {
    // it('should set price for wBTC', async () => {
    //   const abi = getAbiItem(
    //     SimplePriceOracle.abi,
    //     'function',
    //     'setDirectPrice',
    //   )!;
    //
    //   const receipt = await web3Service.executeContractMethod({
    //     address: oracle,
    //     abi,
    //     from: deployer.address,
    //     privateKey: deployer.private,
    //     args: [wBTC, BigInt((1 / 2) * 1e18)],
    //   });
    //
    //   expect(receipt.status).toBeGreaterThan(0n);
    // }, 60_000);
  });

  describe('deployer -> USDT', () => {
    // it('should mint USDT to deployer', async () => {
    //   const abi = ERC20.find((a) => a.name === 'mint');
    //
    //   await web3Service.executeContractMethod({
    //     address: USDT,
    //     abi: abi,
    //     from: deployer.address,
    //     privateKey: deployer.private,
    //     args: [deployer.address, 500n * BigInt(1e18)],
    //   });
    // }, 60_000);
    // it("should set max allowance of deployer's USDT to cUSDT contract", async () => {
    //   const abi = ERC20.find((a) => a.name === 'approve');
    //   await web3Service.executeContractMethod({
    //     address: USDT,
    //     abi,
    //     from: deployer.address,
    //     privateKey: deployer.private,
    //     args: [cUSDT, 500_000n * BigInt(1e18)],
    //   });
    // }, 60_000);
  });

  describe('deployer -> wBTC', () => {
    // it('should initialize new cwBTC', async () => {
    //   const abi = CErc20.abi.find((a) => a.name === 'initialize');
    //
    //   const underlying_ = wBTC;
    //   const comptroller_ = comptroller;
    //   const interestRateModel_ = interestRateModel;
    //   const initialExchangeRateMantissa_ = '20000000000000000';
    //   const name_ = 'Compound Test Wrapped BTC';
    //   const symbol_ = 'cwBTC';
    //   const decimals_ = 8;
    //
    //   const receipt = await web3Service.executeContractMethod({
    //     address: newcwBTC,
    //     abi,
    //     from: deployer.address,
    //     privateKey: deployer.private,
    //     args: [
    //       underlying_,
    //       comptroller_,
    //       interestRateModel_,
    //       initialExchangeRateMantissa_,
    //       name_,
    //       symbol_,
    //       decimals_,
    //     ],
    //   });
    //
    //   console.log(receipt.transactionHash);
    // });
    it('should mint wBTC to deployer', async () => {
      const abi = ERC20.find((a) => a.name === 'mint');

      //   await web3Service.executeContractMethod({
      //     address: wBTC,
      //     abi: abi,
      //     from: deployer.address,
      //     privateKey: deployer.private,
      //     args: [deployer.address, 20_000_000n * BigInt(1e18)],
      //   });
      // }, 60_000);
      //
      //   it("should set max allowance of deployer's wBTC to cwBTC contract", async () => {
      //     const abi = ERC20.find((a) => a.name === 'approve');
      //     await web3Service.executeContractMethod({
      //       address: wBTC,
      //       abi,
      //       from: deployer.address,
      //       privateKey: deployer.private,
      //       args: [cwBTC, maxUint256],
      //     });
      //   }, 60_000);
      // });
      //
    });
  });

  describe('deployer -> cwBTC', () => {
    it('should mint cwBTC to deployer', async () => {
      // const receipt = await marketService.executeMint({
      //   address: cwBTC,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   amount: 20_000_000n * BigInt(1e18),
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);

    it('should redeem cwBTC', async () => {
      // const abi = CErc20.abi.find((a) => a.name === 'redeem');
      //
      // const receipt = await web3Service.executeContractMethod({
      //   address: cwBTC,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [40_000n * BigInt(1e8)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);
  });

  describe('deployer -> cUSDT', () => {
    it('should mint cUSDT', async () => {
      const abi = CErc20.abi.find((a) => a.name === 'mint');

      // const receipt = await web3Service.executeContractMethod({
      //   address: cUSDT,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [500n * BigInt(1e18)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);

    it('should should borrow USDT', () => {});

    it('should add USDT reserves to cUSDT from deployer', async () => {
      const abi = CErc20.abi.find((a) => a.name === '_addReserves');

      // await web3Service.executeContractMethod({
      //   address: cUSDT,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [500_000n * BigInt(1e18)],
      // });
    }, 60_000);

    it('should redeem cUSDT', async () => {
      // const abi = CErc20.abi.find((a) => a.name === 'redeem');
      //
      // const receipt = await web3Service.executeContractMethod({
      //   address: cUSDT,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [8_000n * BigInt(1e8)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);

    it('should borrow USDT', async () => {
      // const receipt = await marketService.executeBorrow({
      //   address: cUSDT,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   amount: 2_000_000n * BigInt(1e18),
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    });

    it('should repay borrow', async () => {
      const abi = CErc20.abi.find((a) => a.name === 'repayBorrow');

      // const receipt = await web3Service.executeContractMethod({
      //   address: cUSDT,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [1_000_000n * BigInt(1e18)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    });
  });

  describe('account1 -> comptroller', () => {
    it('should enter cwBTC and cUSDT to account1', async () => {
      const abi = Comptroller.abi.find((a) => a.name === 'enterMarkets');
      // await web3Service.executeContractMethod({
      //   address: comptroller,
      //   abi,
      //   from: deployer.address,
      //   privateKey: deployer.private,
      //   args: [[cwBTC]],
      // });
    }, 60_000);
  });

  describe('account1 -> wBTC', () => {
    it('should mint wBTC to account1', async () => {
      // const abi = ERC20.find((a) => a.name === 'mint');
      //
      // const receipt = await web3Service.executeContractMethod({
      //   address: wBTC,
      //   abi: abi,
      //   from: account1.address,
      //   privateKey: account1.private,
      //   args: [account1.address, BigInt(10e18)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);

    it("should approve account1's wBTC to cwBTC contract", async () => {
      const abi = ERC20.find((a) => a.name === 'approve');

      // const receipt = await web3Service.executeContractMethod({
      //   address: wBTC,
      //   abi,
      //   from: account1.address,
      //   privateKey: account1.private,
      //   args: [cwBTC, BigInt(1000e18)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);
  });

  describe('account1 -> cUSDT', () => {
    it('should borrow 400_000 USDT to account1', async () => {
      const abi = CErc20.abi.find((a) => a.name === 'borrow');

      // const receipt = await web3Service.executeContractMethod({
      //   address: cUSDT,
      //   abi,
      //   from: account1.address,
      //   privateKey: account1.private,
      //   args: [1n * BigInt(1e8)],
      // });
      //
      // expect(receipt.status).toBeGreaterThan(0n);
    }, 60_000);
  });

  describe('account1 -> cwBTC', () => {
    // it('should mint cwBTC to account1', async () => {
    //   const abi = CErc20.abi.find((a) => a.name === 'mint');
    //
    //   const receipt = await web3Service.executeContractMethod({
    //     address: cwBTC,
    //     abi: abi,
    //     from: account1.address,
    //     privateKey: account1.private,
    //     args: [BigInt(5e18)],
    //   });
    //
    //   expect(receipt.status).toBeGreaterThan(0n);
    // }, 60_000);
  });

  describe('verify', () => {
    it('should calculate account1 liquidity as positive', async () => {
      // const liquidity = await comptrollerService.fetchAccountLiquidity(
      //   deployer.address,
      // );
      //
      // console.log(liquidity);
    });

    it('should get cash of cUSDT', async () => {
      const abi = CErc20.abi.find((a) => a.name === 'getCash')!;

      // const cash = await web3Service.callContractMethod({
      //   address: cUSDT,
      //   abi: abi,
      // });
      //
      // console.log(cash / BigInt(1e18));
    });

    it('should get hypothetical account1 liquidity as positive if borrow 400_000 USDT', async () => {
      // const abi = Comptroller.abi.find(
      //   (a) => a.name === 'getHypotheticalAccountLiquidity',
      // )!;
      //
      // const liquidity = await web3Service.callContractMethod({
      //   address: comptroller,
      //   abi,
      //   args: [deployer.address, cUSDT, 0, 0],
      // });
      //
      // console.log(liquidity);
    });
  });
});
