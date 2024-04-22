import type { IService } from '../../../../common/interfaces/service.interface.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import { getAbiItem } from '../../utils/helpers/array.helpers.ts';
import AccessControlledOffchainAggregator from '../../../../common/uniswap/artifacts/AccessControlledOffchainAggregator.sol/AccessControlledOffchainAggregator.json';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import Env from '../../utils/constants/env.ts';
import { MessageType } from '../../utils/types/message.type.ts';
import type {
  IPendingPriceConfig,
  PendingPriceUpdateMessage,
} from './pending-price-update.message.ts';
import type { BundleService } from '../bundle/bundle.service.ts';
import { Web3 } from 'web3';
import type { NewTokenConfigsMessage } from '../worker/new-token-configs.message.ts';

export class MempoolService implements IService {
  public tokenConfigs: Record<string, TokenConfigEntity> = {};
  private ws: WebSocket | undefined;
  private subscriptionId: string | undefined;
  private isActive = false;

  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly priceOracleService: PriceOracleService,
    public bundleService: BundleService | undefined,
  ) {}

  async init() {
    console.log('method -> mempoolService.init');
    await this.initTokenConfigs();

    this.listenForPendingPriceUpdates();
  }

  listenForPendingPriceUpdates() {
    this.ws?.close();

    this.ws = new WebSocket(Env.BLOXROUTE_WS_URL, {
      rejectUnauthorized: false,
      headers: {
        Authorization: Env.BLOXROUTE_AUTH_HEADER,
      },
    });

    this.ws!.onopen = this.proceedPendingTxSubscription.bind(this);
    this.ws!.onmessage = this.handleNewPendingTx.bind(this);
    this.ws!.onerror = console.error;
    this.ws!.onclose = async () => {
      console.log('Connection closed');
    };
  }

  handleNewPendingTx(nextNotification) {
    // if (this.isActive) {
    //   return;
    // } // TODO: remove this line

    try {
      const data = JSON.parse(nextNotification.data);
      if (!data) throw new Error('Invalid data');

      if (data.error) {
        console.error(data.error);
        return;
      }

      if (typeof data.result === 'string') {
        this.subscriptionId = data.result;
        console.log('Subscription ID:', this.subscriptionId);
        return;
      }

      // this.isActive = true; // TODO: remove this line

      const {
        txHash,
        txContents: { input, to },
        rawTx,
      } = data.params.result;

      console.log('txHash:', txHash);

      const tokenConfig = this.tokenConfigs[Web3.utils.toChecksumAddress(to)];

      const price = this.getPriceFromInput(input, tokenConfig)!;

      if (!price) return;

      console.log('Price:', price);

      const pendingPriceConfig: IPendingPriceConfig = {
        symbolHash: tokenConfig.symbolHash,
        price,
      };

      this.emitPendingPriceUpdate(pendingPriceConfig, rawTx, txHash);
      // const tokenConfig = {} as TokenConfigEntity;

      // if (this.bundleService) {
      // const tokenConfig = this.tokenConfigs[to];

      // this.bundleService
      //   .testBundleTxs([tokenConfig, rawTx])
      //   .catch(console.error);
      // }

      // if (tokenConfig.symbolHash !== EthSymbolHash) {
      //   return;
      // }

      // console.log('ETH price:', tokenConfig.price);
      // Object.values(this.tokenConfigs).forEach((config) => {
      //   if (config.priceSource !== PriceSource.FIXED_ETH) {
      //     return;
      //   }
      //
      //   console.log(
      //     'Processing fixed eth price config for market: ',
      //     config.marketAddress,
      //   );
      //
      //   const usdPerEth = tokenConfig.price!;
      //   const ethBaseUnit = tokenConfig.baseUnit;
      //   const price = mulDiv(usdPerEth, config.fixedPrice, ethBaseUnit);
      //   config.price = price;
      //
      //   this.emitPendingPriceUpdate(config, rawTx);
      // });
    } catch (e) {
      console.error(e);
    }
  }

  proceedPendingTxSubscription() {
    console.log('mempoolService -> Connection established');
    const aggregators = Object.keys(this.tokenConfigs).filter(
      (aggregator) => aggregator,
    );

    const filters = `{to} IN ['${aggregators.join("', '")}']`;

    const data = JSON.stringify({
      id: 1,
      method: 'subscribe',
      params: [
        'newTxs',
        {
          include: ['tx_hash', 'tx_contents.input', 'tx_contents.to', 'raw_tx'],
          filters,
        },
      ],
    });

    this.ws?.send(data);
  }

  getPriceFromInput(input: string, tokenConfig: TokenConfigEntity) {
    const report = this.decodeReport(input);

    if (!report) {
      console.error('Tx input does not contain a report');
      return;
    }

    const observations = this.parseObservations(report);
    if (!observations) return;

    const median = observations[Math.floor(observations.length / 2)];
    if (!median) return;

    if (!tokenConfig) throw new Error('No token config found');

    const price = this.priceOracleService.convertReportedPrice(
      tokenConfig,
      median,
    );

    return price;
  }

  parseObservations(report: string) {
    console.debug('method -> mempoolService.parseObservations');

    // Описание типов данных для декодирования, соответствующее аргументам функции `abi.decode` в солидити
    const typesArray = ['bytes32', 'bytes32', 'int192[]'];

    // Декодирование данных
    const parameters = this.web3Service.decodeParameters(typesArray, report);

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

  async initTokenConfigs() {
    await this.storageService.initTokenConfigs();
    const tokenConfigs = this.storageService.getTokenConfigs();

    if (!tokenConfigs) {
      throw new Error('Token configs not found');
    }

    const values = Object.values(tokenConfigs).filter(
      (tc) => tc.aggregator !== '0xAe74faA92cB67A95ebCAB07358bC222e33A34dA7', // skip wBTC old aggregator, since all his transmissions are invalid
    );

    this.setTokenConfigs(values);
  }

  setTokenConfigs(tokenConfigs: TokenConfigEntity[]) {
    this.tokenConfigs = Object.fromEntries(
      tokenConfigs.map((tc) => [tc.aggregator, tc]),
    );
  }

  emitPendingPriceUpdate(
    config: IPendingPriceConfig,
    rawTx: string,
    txHash: string,
  ) {
    console.log('method -> messageService.emitPendingPriceUpdate');

    const message: PendingPriceUpdateMessage = {
      type: MessageType.pendingPriceUpdate,
      data: {
        pendingPriceConfig: config,
        targetTxRaw: rawTx,
        targetTxHash: txHash,
      },
    };

    postMessage(message);
  }

  handleNewTokenConfigs(message: NewTokenConfigsMessage) {
    console.debug('method -> mempoolService.handleNewTokenConfigs');

    this.setTokenConfigs(message.data);

    this.unsubscribePriceUpdatexBloxRoute();
    this.listenForPendingPriceUpdates();
  }

  unsubscribePriceUpdatexBloxRoute() {
    if (!this.subscriptionId) {
      return;
    }

    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'unsubscribe',
      params: [this.subscriptionId],
    });

    this.ws?.send(data);

    this.subscriptionId = undefined;
  }

  terminate() {
    if (this.ws) {
      this.unsubscribePriceUpdatexBloxRoute();
      this.ws.close();
    }
  }

  // async getAnswer(txHash: string) {
  //   console.debug('method -> mempoolService.getAnswer');
  //
  //   const abi = getAbiItem(
  //     AccessControlledOffchainAggregator,
  //     'event',
  //     'NewTransmission',
  //   );
  //   const signatureHash = this.web3Service.getSignatureHashes([abi])[0];
  //
  //   const logs = await this.web3Service.getTransactionLogs(txHash);
  //
  //   const filteredLogs = logs.filter((log) => log.topics![0] === signatureHash);
  //
  //   const [newTransmissionLog] = this.web3Service.decodeLogs(filteredLogs, [
  //     abi,
  //   ]);
  //
  //   const answer = newTransmissionLog.answer;
  //
  //   return answer;
  // }

  // async subscribeForPriceUpdates() {
  //   console.debug('method -> mempoolService.listenForPendingTxes');
  //
  //   this.subscription = await this.web3Service.subscribeToPendingTxes();
  //
  //   this.subscription.on('data', this.processTx.bind(this));
  // }

  // async processTx(txHash: string) {
  //   console.debug('method -> mempoolService.processTx');
  //
  //   const transaction = await this.web3Service.getTransaction(txHash);
  //
  //   if (transaction) {
  //     const to = Web3.utils.toChecksumAddress(transaction.to);
  //     const aggregators = Object.keys(this.tokenConfigs);
  //
  //     if (aggregators.includes(to)) {
  //     }
  //   }
  // }
}
