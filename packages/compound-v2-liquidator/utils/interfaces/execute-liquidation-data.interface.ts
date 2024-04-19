import type { SignTransactionResult } from 'web3-eth-accounts';

export interface IExecuteLiquidationData {
  rawTargetTx: string;
  tx: SignTransactionResult;
  blockNumber: number;
  collectDetails: (arg?: any) => string[];
}
