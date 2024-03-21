import type { AccountAssetEntity } from './account-asset.entity.ts';

export interface AccountEntity {
  address: string;
  tokens: Record<string, bigint>;
  assets: AccountAssetEntity[];
}
