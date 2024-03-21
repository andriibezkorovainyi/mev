import type { AbiFunctionFragment } from 'web3';

export interface ICallContractMethodParams {
  abi: AbiFunctionFragment;
  address: string;
  args?: any[];
  params?: Record<any, any>;
  blockNumber?: number;
}
