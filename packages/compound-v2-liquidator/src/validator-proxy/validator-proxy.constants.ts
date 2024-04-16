export enum ValidatorProxyEventName {
  AggregatorUpgraded = 'AggregatorUpgraded',
}

export const ValidatorProxyEventToOutput = {
  [ValidatorProxyEventName.AggregatorUpgraded]: 'current',
};
