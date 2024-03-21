import { Service } from '../../utils/classes/service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import ValidatorProxy from '../../../../common/compound-protocol/artifacts/ValidatorProxy.sol/ValidatorProxy.json';
import { getAbiItem } from '../../utils/helpers/array.helpers.ts';
import { PriceSource } from '../price-oracle/price-oracle.constants.ts';

export class AggregatorService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {
    super();
  }

  async createAggregator(tokenConfig: TokenConfigEntity) {
    console.log('tokenConfig', tokenConfig);
    console.debug('method -> createAggregator');

    if (tokenConfig.priceSource === PriceSource.REPORTER) {
      const aggregator = await this.fetchAggregator(tokenConfig.reporter);

      tokenConfig.aggregator = aggregator;
    }
  }

  async fetchAggregator(reporter: string): Promise<string> {
    console.debug('method -> fetchAggregator');

    const abiItem = getAbiItem(ValidatorProxy, 'function', 'getAggregators');

    const aggregators = await this.web3Service.callContractMethod({
      address: reporter,
      abi: abiItem,
    });

    return aggregators['0'];
  }
}
