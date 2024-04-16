export interface IDecodedLog {
  address: string;
  eventName: any;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
  [key: string]: any;
}
