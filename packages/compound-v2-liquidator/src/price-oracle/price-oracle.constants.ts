export enum PriceOracleEventName {
  PriceUpdated = 'PriceUpdated',
  FailoverActivated = 'FailoverActivated',
  FailoverDeactivated = 'FailoverDeactivated',
}

export enum PriceSource {
  FIXED_ETH = 0,
  FIXED_USD = 1,
  REPORTER = 2,
}

export const PriceOracleEventToOutput = {
  [PriceOracleEventName.PriceUpdated]: 'symbolHash,price',
  [PriceOracleEventName.FailoverActivated]: 'symbolHash',
  [PriceOracleEventName.FailoverDeactivated]: 'symbolHash',
};
