import { addRetries } from '../../../../common/helpers/addRetries.ts';
import { Service } from '../../utils/classes/service.ts';
import type { EthExecutionAPI, Log, Web3BaseProvider } from 'web3';
import { Web3 } from 'web3';

import type { ICallContractMethodParams } from './web3.interfaces.ts';
import { filterAbi } from '../../utils/helpers/array.helpers.ts';

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

    // this.webSocketProvider = new Web3.providers.WebsocketProvider(
    //   this.env.WSS_RPC_URL,
    // );
    //
    // this.socketWeb3 = new Web3(this.webSocketProvider);
  }

  async init() {}

  async subscribeToPendingTxes() {
    console.debug('method -> web3Service.subscribeToPendingTxes');

    const subscription = await this.web3.eth.subscribe(
      'pendingTransactions',
      (error) => {
        if (error) {
          console.error('error', error);
        }
      },
    );

    subscription.on('error', console.error);

    return subscription;
  }

  async getTransaction(txHash: string) {
    console.debug('method -> web3Service.getTransaction');

    const method = this.web3.eth.getTransaction.bind(this.web3.eth);

    const transaction = await addRetries(method, txHash);

    return transaction;
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

      promises.push(
        new Promise((resolve) => {
          resolve(this.getFilteredLogs(addresses, _abi, fromBlock, toBlock));
        }),
      );
    }

    return (await Promise.all(promises)).flat();
  }

  async getTransactionLogs(txHash: string): Promise<Log[]> {
    console.debug('method -> web3Service.getTransactionLogs');

    const method = this.web3.eth.getTransactionReceipt.bind(this.web3.eth);

    const receipt = await addRetries(method, txHash);

    return receipt.logs;
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

  decodeLogs(logs, abi) {
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
        blockNumber: log.blockNumber,
        transactionIndex: Number(log.transactionIndex),
        logIndex: Number(log.logIndex),
      });

      return decodedLog;
    });

    return decodedLogs;
  }

  getSignatureHashes(abi: any[]) {
    console.log('method -> web3Service.getSignatureHashes');
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
    console.debug('method -> web3Service.decodeArguments');

    const decodedArguments = this.web3.eth.abi.decodeParameters(
      abiItem.inputs,
      txInput.slice(10),
    );

    return decodedArguments;
  }

  decodeParameters(typesArray: string[], reportData: string) {
    console.debug('method -> web3Service.decodeParameters');

    const decodedData = this.web3.eth.abi.decodeParameters(
      typesArray,
      reportData,
    );

    return decodedData;
  }

  clearSubAndDisconnect() {
    if (this.websocketProvider) {
      // console.log(this.web3?.subscriptionManager.regi steredSubscriptions);

      this.web3?.subscriptionManager.clear();
      this.websocketProvider.removeAllListeners!('connect');
      this.websocketProvider.removeAllListeners!('error');
      this.websocketProvider.removeAllListeners!('end');
      this.websocketProvider.disconnect();
      console.log('subscription cleared and socket is closed');
    }
  }
}
