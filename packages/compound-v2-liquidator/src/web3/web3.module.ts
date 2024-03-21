import { Module } from '../../utils/classes/module.class.ts';
import { Web3Service } from './web3.service.ts';

export class Web3Module extends Module {
  constructor(rpcUrl: string) {
    super();

    const service = new Web3Service(rpcUrl);
    this.registerService('web3Service', service);
  }
}
