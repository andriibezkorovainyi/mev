export interface ComptrollerEntity {
  closeFactorMantissa: bigint;
  priceOracle: string;
  allMarkets: Set<string>;
  liquidationIncentiveMantissa?: bigint;
}
