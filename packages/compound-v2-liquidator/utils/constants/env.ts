import { EnvCommon } from '../../../../common/env-common.ts';

class Env extends EnvCommon {
  public readonly COMPTROLLER_PROXY_ADDRESS: string;
  public readonly PRICE_ORACLE_ADDRESS: string;
  public readonly OFFCHAIN_AGGREGATOR_ADDRESS: string;

  constructor() {
    super();

    this.COMPTROLLER_PROXY_ADDRESS = process.env
      .COMPTROLLER_PROXY_ADDRESS as string;
    this.PRICE_ORACLE_ADDRESS = process.env.PRICE_ORACLE_ADDRESS as string;
    this.OFFCHAIN_AGGREGATOR_ADDRESS = process.env
      .OFFCHAIN_AGGREGATOR_ADDRESS as string;

    if (
      !this.COMPTROLLER_PROXY_ADDRESS ||
      !this.COMPTROLLER_PROXY_ADDRESS.startsWith('0x')
    ) {
      throw new Error('Wrong COMPTROLLER_PROXY_ADDRESS env variable');
    }

    if (
      !this.PRICE_ORACLE_ADDRESS ||
      !this.PRICE_ORACLE_ADDRESS.startsWith('0x')
    ) {
      throw new Error('Wrong PRICE_ORACLE_ADDRESS env variable');
    }

    if (
      !this.OFFCHAIN_AGGREGATOR_ADDRESS ||
      !this.OFFCHAIN_AGGREGATOR_ADDRESS.startsWith('0x')
    ) {
      throw new Error('Wrong OFFCHAIN_AGGREGATOR_ADDRESS env variable');
    }
  }
}

export default new Env();
