import { addRetries } from '../../../../common/helpers/addRetries.ts';
import { Service } from '../../utils/classes/service.ts';
import type {
  EthExecutionAPI,
  TransactionInfoAPI,
  Web3BaseProvider,
} from 'web3';
import { Web3 } from 'web3';
import Env from '../../utils/constants/env.ts';

import type { ICallContractMethodParams } from './web3.interfaces.ts';
import { filterAbi } from '../../utils/helpers/array.helpers.ts';
import type { IDecodedLog } from '../../utils/interfaces/decoded-log.interface.ts';
import type { ICreateRawLiquidationTxParams } from '../../utils/interfaces/create-raw-liquidation-tx-params.interface.ts';

export class Web3Service extends Service {
  readonly web3: Web3;
  readonly websocketProvider: Web3BaseProvider<EthExecutionAPI> | undefined;

  constructor(rpcUrl: string) {
    super();

    if (rpcUrl.startsWith('http')) {
      this.web3 = new Web3(rpcUrl);
    } else {
      this.websocketProvider = new Web3.providers.WebsocketProvider(rpcUrl);

      this.web3 = new Web3(this.websocketProvider);
    }
  }

  async init() {}

  async getTransaction(txHash: string): Promise<TransactionInfoAPI> {
    console.debug('method -> web3Service.getTransaction');

    const method = this.web3.eth.getTransaction.bind(this.web3.eth);

    const transaction = await addRetries(method, txHash);

    return transaction;
  }

  async getTrasactionByBlockAndIndex(blockNumber: number, txIndex: number) {
    return this.web3.eth.getTransactionFromBlock(blockNumber, txIndex);
  }

  async callContractMethod({
    abi,
    address,
    args = [],
    params = {},
    blockNumber,
  }: ICallContractMethodParams) {
    // console.log(abi.name, address, args, params, blockNumber);
    const contract = new this.web3.eth.Contract([abi], address);
    const method = contract.methods[abi.name](...args).call;

    const data = await addRetries.call(this, method, params, blockNumber);

    return data;
  }

  async executeContractMethod({
    abi,
    address,
    args = [] as any[],
    from = '',
    privateKey = '',
    blockNumber = 'latest',
  }) {
    const contract = new this.web3.eth.Contract([abi], address);
    const data = contract.methods[abi.name](...args).encodeABI();

    // const gasEstimate = await contract.methods[abi.name](...args).estimateGas({
    //   from,
    // });

    const transaction = {
      from,
      to: address,
      gas: '100000',
      maxPriorityFeePerGas: this.web3.utils.toWei('2', 'gwei'), // Укажите актуальное значение
      maxFeePerGas: this.web3.utils.toWei('100', 'gwei'),
      data: data,
    };

    const signedTransaction = await this.web3.eth.accounts.signTransaction(
      transaction,
      privateKey,
    );

    return this.sendRawTransaction(signedTransaction.rawTransaction);
  }

  async sendRawTransaction(rawTx: string) {
    return this.web3.eth.sendSignedTransaction(rawTx);
  }

  // async collectContractEvents(abi, address: string) {
  //   const contract = new this.httpWeb3.eth.Contract(abi, address);
  //
  //   const events = await contract.getPastEvents('allEvents', {
  //     fromBlock: 19061330,
  //     toBlock: 19161539,
  //   });
  //
  //   return events;
  // }

  async getFilteredLogsByPieces(
    addresses: string[],
    abi,
    eventNames,
    fromBlock: number,
    toBlock: number,
  ) {
    const promises = [];

    for (let i = 0; i < eventNames.length; i += 3) {
      const _eventNames = eventNames.slice(i, i + 3);
      const _abi = filterAbi(abi, _eventNames);

      promises.push(this.getFilteredLogs(addresses, _abi, fromBlock, toBlock));
    }

    return (await Promise.all(promises)).flat();
  }

  // async getTransactionLogs(txHash: string): Promise<Log[]> {
  //   console.debug('method -> web3Service.getTransactionLogs');
  //
  //   const method = this.web3.eth.getTransactionReceipt.bind(this.web3.eth);
  //
  //   const receipt = await addRetries(method, txHash);
  //
  //   return receipt.logs;
  // }

  async getFlashbotsSignature(body: string) {
    console.log('method -> web3Service.getFlashbotsSignature');
    // ethers.js
    // const wallet = new Wallet(Env.PRIVATE_KEY);
    // const signature =
    //   wallet.address + ':' + (await wallet.signMessage(ethers.id(body)));

    // return signature;
  }

  async getFilteredLogs(
    address: string[],
    abi: any[],
    fromBlock: number | string = 'earliest',
    toBlock: number | string = 'latest',
  ) {
    // console.debug('method -> getFilteredLogs');

    const topics = this.getSignatureHashes(abi);

    // const topicToEvent = topics.reduce((acc, topic, index) => {
    //   acc[topic] = abi[index].name;
    //   return acc;
    // }, {});

    // console.log(topicToEvent);

    const filter = {
      fromBlock,
      toBlock,
      address,
      topics: [topics],
    };

    const method = this.web3.eth.getPastLogs.bind(this.web3.eth);

    const logs = await addRetries(method, filter);

    return logs;
  }

  decodeLogs(logs, abi): IDecodedLog[] {
    const eventSignatureHashes = this.getSignatureHashes(abi);

    // console.log('eventSignatureHashes', eventSignatureHashes);
    const decodedLogs = logs.map((log) => {
      const abiItemIndex = eventSignatureHashes.findIndex(
        (signature) => signature === log.topics[0],
      );

      const abiItem = abi[abiItemIndex];

      const decodedLog = this.web3.eth.abi.decodeLog(
        abiItem.inputs,
        log.data,
        log.topics.slice(1),
      );

      Object.assign(decodedLog, {
        address: Web3.utils.toChecksumAddress(log.address),
        eventName: abiItem.name,
        blockNumber: Number(log.blockNumber),
        transactionIndex: Number(log.transactionIndex),
        logIndex: Number(log.logIndex),
      });

      // if (
      //   Object.values(decodedLog).includes(
      //     '0x1164236009849Feec5F941f6F652ee6928Bdc7bb',
      //   )
      // ) {
      //   console.log('decodedLog', decodedLog);
      //
      //   saveOrUpdateObjectFileSync(
      //     decodedLog,
      //     '0x1164236009849Feec5F941f6F652ee6928Bdc7bb.json',
      //   );
      // }

      return decodedLog;
    });

    return decodedLogs;
  }

  getSignatureHashes(abi: any[]) {
    // console.log('method -> web3Service.getSignatureHashes');
    // console.log(abi);
    return abi.map((item) =>
      this.web3.utils.sha3(
        item.name +
          '(' +
          item.inputs.map((input) => input.type).join(',') +
          ')',
      ),
    );
  }

  getSignature(abiItem: any): string {
    const signatureHash = this.getSignatureHashes([abiItem])[0];

    if (!signatureHash) throw new Error('No signature hash');

    return signatureHash.slice(0, 10);
  }

  async getNetworkHeight() {
    console.debug('method -> web3Service.getNetworkHeight');
    const fn = this.web3.eth.getBlockNumber.bind(this.web3.eth);
    const result = await addRetries(fn);

    return Number(result);
  }

  decodeArguments(abiItem: any, txInput: string) {
    // console.debug('method -> web3Service.decodeArguments');

    const decodedArguments = this.web3.eth.abi.decodeParameters(
      abiItem.inputs,
      txInput.slice(10),
    );

    return decodedArguments;
  }

  decodeParameters(typesArray: string[], reportData: string) {
    // console.debug('method -> web3Service.decodeParameters');

    const decodedData = this.web3.eth.abi.decodeParameters(
      typesArray,
      reportData,
    );

    return decodedData;
  }

  async createAndSignTx({
    abi,
    address,
    args,
    gas,
    maxFeePerGas,
  }: ICreateRawLiquidationTxParams) {
    const contract = new this.web3.eth.Contract([abi], address);
    const data = contract.methods[abi.name](...args).encodeABI();

    const transaction = {
      from: Env.FROM_ADDRESS,
      to: address,
      gas,
      maxFeePerGas,
      maxPriorityFeePerGas: this.web3.utils.toWei('0.01', 'gwei'),
      value: 0n,
      data,
    };

    const signedTransaction = await this.web3.eth.accounts.signTransaction(
      transaction,
      Env.PRIVATE_KEY,
    );

    return signedTransaction;
  }

  async createRawTestTx() {
    // web3.js
    const transaction = {
      from: Env.FROM_ADDRESS,
      to: Env.LIQUIDATOR_CONTRACT_ADDRESS,
      gas: '22000',
      maxFeePerGas: this.web3.utils.toWei('100', 'gwei'),
      maxPriorityFeePerGas: this.web3.utils.toWei('10', 'gwei'),
      value: 0n,
    };

    const signedTransaction = await this.web3.eth.accounts.signTransaction(
      transaction,
      Env.PRIVATE_KEY,
    );

    return signedTransaction.rawTransaction;
  }

  async getNonce(address: string) {
    return this.web3.eth.getTransactionCount(Env.FROM_ADDRESS);
  }

  clearSubAndDisconnect() {
    if (this.websocketProvider) {
      // console.log(this.web3?.subscriptionManager.registeredSubscriptions);

      this.web3?.subscriptionManager.clear();
      this.websocketProvider.removeAllListeners!('connect');
      this.websocketProvider.removeAllListeners!('error');
      this.websocketProvider.removeAllListeners!('end');
      this.websocketProvider.disconnect();
      console.log('subscription is cleared and socket is closed');
    }
  }

  async getNetworkBaseFee() {
    const block = await this.web3.eth.getBlock('latest');

    return this.web3.utils.fromWei(block.baseFeePerGas!, 'gwei');
  }

  async getNetworkGasPrice() {
    const gasPrice = await this.web3.eth.getGasPrice();

    return this.web3.utils.fromWei(gasPrice, 'gwei');
  }
}
