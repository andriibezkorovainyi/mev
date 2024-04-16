import { Module } from '../../utils/classes/module.class.ts';
import type { Web3Module } from '../web3/web3.module.ts';
import { BundleService } from './bundle.service.ts';

export class BundleModule extends Module {
  constructor(public web3Module: Web3Module) {
    super();

    const service = new BundleService(web3Module.getService('web3Service'));
    this.registerService('bundleService', service);
  }
}
