import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import ValidatorProxy from '../../../../common/uniswap/artifacts/ValidatorProxy.sol/ValidatorProxy.json';
import { getAbiItem, sortLogs } from '../../utils/helpers/array.helpers.ts';
import {
  ValidatorProxyEventName,
  ValidatorProxyEventToOutput,
} from './validator-proxy.constants.ts';
import type { IDecodedLog } from '../../utils/interfaces/decoded-log.interface.ts';
import type { WorkerService } from '../worker/worker.service.ts';

export class ValidatorProxyService extends Service {
  public workerService: WorkerService | undefined;

  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {
    super();
  }

  processLogs(logs: IDecodedLog[]) {
    console.debug('method -> processLogs');

    for (const log of logs) {
      switch (log.eventName) {
        case ValidatorProxyEventName.AggregatorUpgraded:
          this.aggregatorUpdated(log);
          break;
        default:
          console.warn('Unknown event', log.eventName);
      }
    }
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> validatorProxySer.collectLogs');

    const reporters = Object.values(this.storageService.getTokenConfigs()).map(
      (tokenC) => tokenC.reporter,
    );

    if (reporters.length === 0) {
      return [];
    }

    const eventNames = Object.values(ValidatorProxyEventName);
    const abi = ValidatorProxy;

    const logs = await this.web3Service.getFilteredLogsByPieces(
      reporters,
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    const decodedLogs = sortLogs(this.web3Service.decodeLogs(logs, abi));

    return decodedLogs;
  }

  aggregatorUpdated(log) {
    const key1 =
      ValidatorProxyEventToOutput[ValidatorProxyEventName.AggregatorUpgraded];
    const newAggregator = log[key1];

    const reporter = log.address;

    const tokenConfig = this.storageService.getTokenConfigByReporter(reporter);

    if (!tokenConfig) {
      throw new Error(`Token config not found.\nreporter: ${reporter}`);
    }

    tokenConfig.aggregator = newAggregator;

    const newTokenConfigs = Object.values(
      this.storageService.getTokenConfigs(),
    );

    this.workerService?.emitNewTokenConfigs(newTokenConfigs);
  }

  // async createAggregator(tokenConfig: TokenConfigEntity) {
  //   console.debug('method -> createAggregator');
  //
  //   if (tokenConfig.priceSource === PriceSource.REPORTER) {
  //     const aggregator = await this.fetchAggregator(tokenConfig.reporter);
  //
  //     tokenConfig.aggregator = aggregator;
  //   }
  // }

  async fetchAggregator(
    reporter: string,
    blockNumber?: number,
  ): Promise<string> {
    console.debug('method -> fetchAggregator');

    const abiItem = getAbiItem(ValidatorProxy, 'function', 'getAggregators');

    const aggregators = await this.web3Service.callContractMethod({
      address: reporter,
      abi: abiItem,
      blockNumber,
    });

    return aggregators['current'];
  }
}
