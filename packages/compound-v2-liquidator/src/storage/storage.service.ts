import type { CacheService } from '../cache/cache.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { ComptrollerEntity } from '../comptroller/comptroller.entity.ts';
import type { MarketEntity } from '../market/market.entity.ts';
import type { AccountEntity } from '../account/account.entity.ts';
import { UnitrollerDeploymentBlock } from '../../utils/constants/settings.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';

export class StorageService extends Service {
  private pointerHeight = 0;

  private networkHeight = 0;

  private comptroller = {} as ComptrollerEntity;

  private markets: Record<string, MarketEntity> = {};

  private accounts = new Map<string, AccountEntity>();

  private tokenConfigs: Record<string, TokenConfigEntity> = {};

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async init() {
    this.pointerHeight =
      (await this.cacheService.get('pointerHeight')) ||
      UnitrollerDeploymentBlock;

    this.comptroller = (await this.cacheService.get('comptroller')) || {
      allMarkets: new Set([]),
      closeFactorMantissa: 0n,
      priceOracle: '',
    };

    this.markets = (await this.cacheService.get('markets')) || {};

    this.accounts = new Map(await this.cacheService.get('accounts'));

    this.tokenConfigs = (await this.cacheService.get('tokenConfigs')) || {};
  }

  async initTokenConfigs() {
    const tokenConfigs = await this.cacheService.get('tokenConfigs');
    if (tokenConfigs) {
      this.tokenConfigs = tokenConfigs;
    }
  }

  async initComptroller() {
    const comptroller = await this.cacheService.get('comptroller');
    if (comptroller) {
      this.comptroller = comptroller;
    }
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
  getTokenConfigBySymbolHash(symbolHash: string) {
    return Object.values(this.tokenConfigs).find(
      (tC) => tC.symbolHash === symbolHash,
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
    await this.cacheService.set('pointerHeight', this.pointerHeight);
    await this.cacheService.set('comptroller', this.comptroller);
    await this.cacheService.set('markets', this.markets);
    await this.cacheService.set('accounts', this.accounts);
    await this.cacheService.set('tokenConfigs', this.tokenConfigs);
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

  getAccounts() {
    return this.accounts;
  }

  setNetworkHeight(value: number) {
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
}
