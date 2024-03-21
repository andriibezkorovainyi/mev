import type { AccountEntity } from '../../src/account/account.entity.ts';
import type { AccountAssetEntity } from '../../src/account/account-asset.entity.ts';
import type { AccountTokenEntity } from '../../src/account/account-token.entity.ts';

export function findIndexByAddr(
  arr: Array<AccountAssetEntity | AccountTokenEntity>,
  _address: string,
) {
  return arr.findIndex(({ address }) => address === _address);
}

export function findAssetOrTokenIndex(account: AccountEntity, cToken: string) {
  return [
    findIndexByAddr(account.assets, cToken),
    findIndexByAddr(account.tokens, cToken),
  ];
}

export function findAssetOrToken(account: AccountEntity, cToken: string) {
  // eslint-disable-next-line prefer-const
  let [assetIndex, tokenIndex] = findAssetOrTokenIndex(account, cToken);

  // Safe to remove token if it's already in assets
  if (assetIndex > -1 && tokenIndex > -1) {
    account.tokens.splice(tokenIndex, 1);
    tokenIndex = -1;
  }

  return assetIndex > -1
    ? account.assets[assetIndex]
    : account.tokens[tokenIndex];
}

export function findTokenIndex(account: AccountEntity, cToken: string) {
  return findIndexByAddr(account.tokens, cToken);
}

export function findToken(account: AccountEntity, cToken: string) {
  const index = findIndexByAddr(account.tokens, cToken);
  return account.tokens[index];
}

export function findAsset(account: AccountEntity, cToken: string) {
  const index = findIndexByAddr(account.assets, cToken);
  return account.assets[index];
}

export function sortLogs(events) {
  return events.sort((a, b) => {
    // Сначала сравниваем по blockNumber
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    // Если blockNumber одинаковы, сравниваем по transactionIndex
    if (a.transactionIndex !== b.transactionIndex) {
      return a.transactionIndex - b.transactionIndex;
    }
    // Если и transactionIndex одинаковы, сравниваем по logIndex
    return a.logIndex - b.logIndex;
  });
}

export function filterAbi(abi, eventNames) {
  return abi.filter(
    (item) => item.type === 'event' && eventNames.includes(item.name!),
  );
}

export function getAbiItem(abi, type: 'function' | 'event', name: string) {
  return abi.find((item) => item.type === type && item.name === name);
}
