import type { CacheService } from '../cache/cache.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { ComptrollerEntity } from '../comptroller/comptroller.entity.ts';
import type { MarketEntity } from '../market/market.entity.ts';
import type { AccountEntity } from '../account/account.entity.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import { PriceSource } from '../price-oracle/price-oracle.constants.ts';
import Env from '../../utils/constants/env.ts';
import { EthSymbolHash } from '../mempool/mempool.constants.ts';

export class StorageService extends Service {
  private pointerHeight = 0;

  private networkHeight = 0;

  private baseFeePerGas = 0n;

  private comptroller = {} as ComptrollerEntity;

  private markets: Record<string, MarketEntity> = {};

  private accounts = new Map<string, AccountEntity>();

  private tokenConfigs: Record<string, TokenConfigEntity> = {};

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async init() {
    await this.initPointerHeight();

    await this.initComptroller();

    await this.initAccounts();

    await this.initMarkets();

    await this.initTokenConfigs();

    await this.initBaseFeePerGas();
  }

  async initAccounts() {
    this.accounts = new Map(await this.cacheService.get('accounts'));
  }

  async initMarkets() {
    this.markets = (await this.cacheService.get('markets')) || {};
  }

  async initTokenConfigs() {
    this.tokenConfigs = (await this.cacheService.get('tokenConfigs')) || {};
  }

  async initBaseFeePerGas() {
    this.baseFeePerGas = BigInt(
      (await this.cacheService.get('baseFeePerGas')) || 0,
    );
  }

  async initComptroller() {
    this.comptroller = (await this.cacheService.get('comptroller')) || {
      allMarkets: new Set([]),
      closeFactorMantissa: 0n,
      priceOracle: '',
      liquidationIncentiveMantissa: 0n,
    };
  }

  async initPointerHeight() {
    this.pointerHeight =
      (await this.cacheService.get('pointerHeight')) ||
      Env.UNITROLLER_DEPLOYMENT_BLOCK;
  }

  // getAll() {
  //   return {
  //     pointerHeight: this.pointerHeight,
  //     networkHeight: this.networkHeight,
  //     comptroller: this.comptroller,
  //     markets: this.markets,
  //     accounts: this.accounts,
  //   };
  // }
  getEthTokenConfig() {
    return Object.values(this.tokenConfigs).find(
      (tC) => tC.symbolHash === EthSymbolHash,
    );
  }

  getFixedEthTokenConfigs() {
    return Object.values(this.tokenConfigs).filter(
      (tC) => tC.priceSource === PriceSource.FIXED_ETH,
    );
  }

  getTokenConfigsBySymbolHash(symbolHash: string) {
    return Object.values(this.tokenConfigs).filter(
      (tC) => tC.symbolHash === symbolHash,
    );
  }

  getTokenConfigByCToken(cToken: string) {
    return this.tokenConfigs[cToken];
  }

  getTokenConfigsByPriceSource(priceSource: PriceSource) {
    return Object.values(this.tokenConfigs).filter(
      (tC) => tC.priceSource === priceSource,
    );
  }

  getTokenConfigByReporter(reporter: string) {
    return Object.values(this.tokenConfigs).find(
      (tC) => tC.reporter === reporter,
    );
  }

  getTokenConfig(cToken: string) {
    return this.tokenConfigs[cToken];
  }

  getTokenConfigs() {
    return this.tokenConfigs;
  }

  setTokenConfig(cToken: string, tokenConfig: TokenConfigEntity) {
    this.tokenConfigs[cToken] = tokenConfig;
  }

  setTokenConfigs(tokenConfigs: Record<string, TokenConfigEntity>) {
    this.tokenConfigs = tokenConfigs;
  }

  async cacheMarkets() {
    await this.cacheService.set('markets', this.markets);
  }

  async cacheMemory() {
    await this.cacheService.setEntries([
      ['pointerHeight', this.pointerHeight],
      ['comptroller', this.comptroller],
      ['markets', this.markets],
      ['accounts', this.accounts],
      ['tokenConfigs', this.tokenConfigs],
      ['baseFeePerGas', this.baseFeePerGas],
    ]);
  }

  async cacheTokenConfigs() {
    await this.cacheService.set('tokenConfigs', this.tokenConfigs);
  }

  async cachePointerHeight() {
    await this.cacheService.set('pointerHeight', this.pointerHeight);
  }

  getMarket(address: string) {
    return this.markets[address];
  }

  setMarket(address: string, market: MarketEntity) {
    this.markets[address] = market;
  }

  getPointerHeight() {
    return this.pointerHeight;
  }

  setPointerHeight(value: number) {
    const pointerHeight = Number(value);
    if (Number.isNaN(pointerHeight)) {
      throw new Error(`Invalid value for pointerHeight - ${value}`);
    }
    this.pointerHeight = pointerHeight;
  }

  getNetworkHeight() {
    return this.networkHeight;
  }

  getMarkets() {
    return this.markets;
  }

  getMarketsBySymbolHash(symbolHash: string) {
    return this.getTokenConfigsBySymbolHash(symbolHash).map(
      ({ marketAddress }) => this.getMarket(marketAddress),
    );
  }

  getAccounts() {
    return this.accounts;
  }

  setNetworkHeight(value: number | string) {
    const networkHeight = Number(value);
    if (Number.isNaN(networkHeight)) {
      throw new Error(`Invalid value for networkHeight - ${value}`);
    }
    this.networkHeight = networkHeight;
  }

  setComptroller(_comptroller: ComptrollerEntity) {
    Object.assign(this.comptroller, _comptroller);
  }

  getComptroller(): ComptrollerEntity {
    return this.comptroller;
  }

  getAccount(address: string) {
    return this.accounts.get(address);
  }

  setAccount(address: string, account: AccountEntity) {
    this.accounts.set(address, account);
  }

  getBaseFeePerGas() {
    return this.baseFeePerGas;
  }

  setBaseFeePerGas(value: number | string) {
    this.baseFeePerGas = BigInt(value);
  }
}
