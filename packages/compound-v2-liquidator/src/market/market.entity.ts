export interface MarketEntity {
  address: string;

  symbol: string;

  decimals: number;

  underlyingAddress: string;

  underlyingDecimals: number;

  underlyingSymbol: string;

  underlyingPriceMantissa: bigint;

  pendingUnderlyingPriceMantissa?: bigint;

  accounts: Set<string>;

  /////////////////
  // Calculation //
  /////////////////

  borrowIndex: bigint;

  exchangeRateMantissa: bigint;

  exchangeRateLastUpdateBlock: number;

  // interestRateModel: string;

  // totalSupply: bigint;

  // totalCash: bigint;

  // totalBorrows: bigint;

  // totalReserves: bigint;

  accrualBlockNumber: bigint;

  reserveFactorMantissa: bigint;

  collateralFactorMantissa: bigint;

  borrowRateMantissa: bigint;
}
