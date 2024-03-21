import type { IService } from '../../../../common/interfaces/service.interface.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import { NewPendingTransactionsSubscription } from 'web3-eth';
import { getAbiItem } from '../../utils/helpers/array.helpers.ts';
import AccessControlledOffchainAggregator from '../../../../common/compound-protocol/artifacts/AccessControlledOffchainAggregator.sol/AccessControlledOffchainAggregator.json';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import { Web3 } from 'web3';
import type { StorageService } from '../storage/storage.service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { MessageService } from './message.service.ts';
import { EthSymbolHash } from './mempool.constants.ts';
import { PriceSource } from '../price-oracle/price-oracle.constants.ts';

export class MempoolService implements IService {
  private subscription: NewPendingTransactionsSubscription | undefined;

  public tokenConfigs: Record<string, TokenConfigEntity> = {};

  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly priceOracleService: PriceOracleService,
    private readonly messageService: MessageService,
  ) {}

  async init() {
    console.log('method -> mempoolService.init');
    this.listenForShutdown();

    // await this.initTokenConfigs();

    // this.messageService.emitPendingPriceUpdate('hi there');

    // this.aggregators = this.tokenConfigs.map(
    //   (tConfig) => tConfig.aggregator,
    // );

    // await this.listenForPriceUpdates();
  }

  async initTokenConfigs() {
    await this.storageService.initTokenConfigs();
    const tokenConfigs = this.storageService.getTokenConfigs();

    if (!tokenConfigs) {
      throw new Error('Token configs not found');
    }

    const values = Object.values(tokenConfigs);

    this.tokenConfigs = Object.fromEntries(
      values.map((value) => {
        return [value.aggregator, value];
      }),
    );
  }

  async listenForPriceUpdates() {
    console.debug('method -> mempoolService.listenForPendingTxes');

    this.subscription = await this.web3Service.subscribeToPendingTxes();

    this.subscription.on('data', this.processTx.bind(this));
  }

  async processTx(txHash: string) {
    console.debug('method -> mempoolService.processTx');

    const transaction = await this.web3Service.getTransaction(txHash);

    if (transaction) {
      const to = Web3.utils.toChecksumAddress(transaction.to);
      const aggregators = Object.keys(this.tokenConfigs);

      if (aggregators.includes(to)) {
        const report = this.decodeReport(transaction.input);

        if (report) {
          const observations = this.parseObservations(report);
          const median = observations[Math.ceil(observations.length / 2)];
          const tokenConfig = this.tokenConfigs[to];

          const convertedPrice = this.priceOracleService.convertReportedPrice(
            tokenConfig,
            median,
          );

          tokenConfig.price = convertedPrice;

          this.messageService.emitPendingPriceUpdate(tokenConfig);

          if (tokenConfig.symbolHash === EthSymbolHash) {
            Object.values(this.tokenConfigs).forEach((config) => {
              if (config.priceSource === PriceSource.FIXED_ETH) {
                const convertedPrice =
                  this.priceOracleService.convertReportedPrice(config, median);

                config.price = convertedPrice;

                this.messageService.emitPendingPriceUpdate(config);
              }
            });
          }
        }
      }
    }
  }

  async getAnswer(txHash: string) {
    console.debug('method -> mempoolService.getAnswer');

    const abi = getAbiItem(
      AccessControlledOffchainAggregator,
      'event',
      'NewTransmission',
    );
    const signatureHash = this.web3Service.getSignatureHashes([abi])[0];

    const logs = await this.web3Service.getTransactionLogs(txHash);

    const filteredLogs = logs.filter((log) => log.topics![0] === signatureHash);

    const [newTransmissionLog] = this.web3Service.decodeLogs(filteredLogs, [
      abi,
    ]);

    const answer = newTransmissionLog.answer;

    return answer;
  }

  parseObservations(report: string) {
    console.debug('method -> mempoolService.parseObservations');

    // Описание типов данных для декодирования, соответствующее аргументам функции `abi.decode` в солидити
    const typesArray = ['bytes32', 'bytes32', 'int192[]'];

    // Декодирование данных
    const parameters = this.web3Service.decodeParameters(typesArray, report);
    // web3.eth.abi.decodeParameters(typesArray, reportData);

    // Извлечение observations
    const observations = parameters[2];

    return observations as bigint[];
  }

  decodeReport(txInput: string) {
    const abiItem = getAbiItem(
      AccessControlledOffchainAggregator,
      'function',
      'transmit',
    );
    const transmitSignature = this.web3Service.getSignature(abiItem);

    if (!txInput.startsWith(transmitSignature)) {
      return;
    }

    const args = this.web3Service.decodeArguments(abiItem, txInput);

    return args['0'] as string;
  }

  listenForShutdown() {
    process.on('SIGINT', this.cleanUpAndExit.bind(this));
    process.on('SIGTERM', this.cleanUpAndExit.bind(this));
    process.on('uncaughtException', this.cleanUpAndExit.bind(this));
    process.on('unhandledRejection', this.cleanUpAndExit.bind(this));
  }

  cleanUpAndExit(message: any) {
    console.debug('method -> mempoolService.cleanUpAndExit');
    console.log(message);

    this.web3Service.clearSubAndDisconnect();

    process.exit(1);
  }
}
