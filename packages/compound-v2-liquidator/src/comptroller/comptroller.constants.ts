export const UnitrollerSearchEventNames = ['NewImplementation'];

export enum CompEventName {
  MarketListed = 'MarketListed',
  MarketEntered = 'MarketEntered',
  MarketExited = 'MarketExited',
  NewCloseFactor = 'NewCloseFactor',
  NewCollateralFactor = 'NewCollateralFactor',
  NewPriceOracle = 'NewPriceOracle',
  // NewLiquidationIncentive = 'NewLiquidationIncentive',
}

export const CompEventToOutputMap = {
  [CompEventName.MarketListed]: 'cToken',
  [CompEventName.MarketEntered]: 'cToken,account',
  [CompEventName.MarketExited]: 'cToken,account',
  [CompEventName.NewCloseFactor]: 'newCloseFactorMantissa',
  [CompEventName.NewCollateralFactor]: 'cToken,newCollateralFactorMantissa',
  // [CompEventName.NewLiquidationIncentive]: 'newLiquidationIncentiveMantissa',
  [CompEventName.NewPriceOracle]: 'newPriceOracle',
};
