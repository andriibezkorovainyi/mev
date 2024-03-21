export interface AccountAssetEntity {
  address: string;
  // balance: bigint; // cToken
  principal: bigint; // Underlying asset

  interestIndex: bigint;
}
