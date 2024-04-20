import type { ILiquidationData } from './liquidation-data.interface.ts';

export interface ITxData {
  targetTxRaw: string;
  targetTxHash: string;
  liquidationData: ILiquidationData;
  biggestBorrow: {
    value: bigint;
    index: number;
  };
}
