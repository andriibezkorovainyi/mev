export interface MarketEntity {
  address: string;

  symbol: string;

  decimals: number;

  underlyingAddress: string;

  underlyingDecimals: number;

  underlyingSymbol: string;

  underlyingPriceMantissa: bigint;

  accounts: Set<string>;

  /////////////////
  // Calculation //
  /////////////////

  borrowIndex: bigint;

  exchangeRateMantissa: bigint;

  // interestRateModel: string;

  totalSupply: bigint;

  totalCash: bigint;

  totalBorrows: bigint;

  totalReserves: bigint;

  accrualBlockNumber: bigint;

  reserveFactorMantissa: bigint;

  collateralFactorMantissa: bigint;

  borrowRateMantissa: bigint;
}
