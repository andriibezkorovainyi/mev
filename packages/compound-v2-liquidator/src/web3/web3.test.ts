import { beforeAll, describe, it } from 'bun:test';
import type { Web3Service } from './web3.service.ts';
import MasterModule from '../master/master.module.ts';

describe('Web3', () => {
  let web3Service: Web3Service;

  beforeAll(() => {
    const masterModule = new MasterModule(undefined as unknown as Worker);
    web3Service = masterModule.web3Module.getService('web3Service');
  });

  // it('should create tx and get nonce of it', async () => {
  //   const tx = await web3Service.createRawTestTx();
  //   const nonce = web3Service.getTxNonce(tx);
  //
  //   console.log(nonce);
  // });

  it('should encode parameters', () => {
    const address = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const amount = 3000;
    const typesArray = ['address', 'uint24', 'address', 'uint24', 'address'];
    const valuesArra = [address, amount, address, amount, address];

    const encoded = web3Service.encodeParameters(typesArray, valuesArra);

    console.log(encoded);
  });

  it('should send rawTx', async () => {
    // const receipt = await web3Service.sendRawTransaction(
    //   '0x02f86c010285037e11d60085104c533c008255f0947014852d523d70dd671cbcb1841fbd67109067258080c001a00459fde0d3dce8e8d7db2276c18c6c6aa93947902c15514ec060c39dff6801b0a078892a5e7dd46233920ac8602551d6c633b86a9bffda7be01f51b896a621d634',
    // );
    //
    // console.log(receipt);
  }, 60_000);

  // it('should get nonce', async () => {
  //   const nonce = await web3Service.getNonce(Env.FROM_ADDRESS);
  //
  //   console.log('Nonce:', nonce);
  // });

  // it('should get network base fee', async () => {
  //   const baseFee = await web3Service.getNetworkBaseFee();
  //   console.log('Base fee:', baseFee);
  // });
  //
  // it('should get network gas price', async () => {
  //   const gasPrice = await web3Service.getNetworkGasPrice();
  //   console.log('Gas price:', gasPrice);
  // });
});
