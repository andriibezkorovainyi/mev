export enum PriceOracleEventName {
  PriceUpdated = 'PriceUpdated',
  PriceGuarded = 'PriceGuarded',
  FailoverActivated = 'FailoverActivated',
  FailoverDeactivated = 'FailoverDeactivated',
  PricePosted = 'PricePosted',
}

export enum PriceSource {
  FIXED_ETH = 0,
  FIXED_USD = 1,
  REPORTER = 2,
}

export const PriceOracleEventToOutput = {
  [PriceOracleEventName.PricePosted]: 'asset,newPriceMantissa',
  [PriceOracleEventName.PriceUpdated]: 'symbolHash,price',
  [PriceOracleEventName.PriceGuarded]: 'symbolHash,anchorPrice',
  [PriceOracleEventName.FailoverActivated]: 'symbolHash',
  [PriceOracleEventName.FailoverDeactivated]: 'symbolHash',
};
