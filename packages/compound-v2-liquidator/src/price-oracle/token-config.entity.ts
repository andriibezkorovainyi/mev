import type { PriceSource } from './price-oracle.constants.ts';

export interface TokenConfigEntity {
  marketAddress: string;

  price?: bigint;

  baseUnit: bigint;

  priceSource: PriceSource;

  fixedPrice: bigint;

  reporterMultiplier: bigint;

  reporter: string;

  aggregator: string;

  failoverActive: boolean;

  symbolHash: string;
}
