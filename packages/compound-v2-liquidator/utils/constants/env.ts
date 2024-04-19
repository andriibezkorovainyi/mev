import { EnvCommon } from '../../../../common/env-common.ts';

class Env extends EnvCommon {
  public COMPTROLLER_PROXY_ADDRESS: string;

  public readonly PRICE_ORACLE_ADDRESS: string;

  public SHOULD_FETCH_EXCHANGE_RATES: boolean;

  public readonly NORMAL_PRICE_ORACLE_START_BLOCK: number;

  public readonly BLOCK_FILTER_BATCH: number;

  public UNITROLLER_DEPLOYMENT_BLOCK: number;

  public readonly LIQUIDATOR_CONTRACT_ADDRESS: string;

  public BLOXROUTE_WS_URL: string;

  public BLOXROUTE_HTTPS_URL: string;

  public readonly BLOXROUTE_AUTH_HEADER: string;

  public readonly FROM_ADDRESS: string;

  public readonly PRIVATE_KEY: string;

  public readonly FLASHBOTS_HTTPS_URL: string;

  public readonly MINIMUM_LIQUIDATION_VALUE: number;

  public SHOULD_EMIT_LIQUIDATION_EVENTS: boolean;

  public SHOULD_FETCH_UNDERLYING_PRICE: boolean;

  public readonly TG_BOT_TOKEN: string;

  public readonly CHAT_ID: string;

  public SHOULD_SEND_TELEGRAM: boolean;

  constructor() {
    super();

    this.COMPTROLLER_PROXY_ADDRESS = process.env
      .COMPTROLLER_PROXY_ADDRESS as string;

    this.PRICE_ORACLE_ADDRESS = process.env.PRICE_ORACLE_ADDRESS as string;

    this.SHOULD_FETCH_EXCHANGE_RATES =
      (process.env.SHOULD_FETCH_EXCHANGE_RATES as string) === 'true';

    this.NORMAL_PRICE_ORACLE_START_BLOCK = parseInt(
      process.env.NORMAL_PRICE_ORACLE_START_BLOCK as string,
    );

    this.BLOCK_FILTER_BATCH = parseInt(
      process.env.BLOCK_FILTER_BATCH as string,
    );

    this.UNITROLLER_DEPLOYMENT_BLOCK = parseInt(
      process.env.UNITROLLER_DEPLOYMENT_BLOCK as string,
    );

    this.LIQUIDATOR_CONTRACT_ADDRESS = process.env
      .LIQUIDATOR_CONTRACT_ADDRESS as string;

    this.BLOXROUTE_WS_URL = process.env.BLOXROUTE_WS_URL as string;

    this.BLOXROUTE_HTTPS_URL = process.env.BLOXROUTE_HTTPS_URL as string;

    this.BLOXROUTE_AUTH_HEADER = process.env.BLOXROUTE_AUTH_HEADER as string;

    this.FROM_ADDRESS = process.env.FROM_ADDRESS as string;

    this.PRIVATE_KEY = process.env.PRIVATE_KEY as string;

    this.FLASHBOTS_HTTPS_URL = process.env.FLASHBOTS_HTTPS_URL as string;

    this.MINIMUM_LIQUIDATION_VALUE = Number(
      process.env.MINIMUM_LIQUIDATION_VALUE as string,
    );

    this.TG_BOT_TOKEN = process.env.TG_BOT_TOKEN as string;

    this.CHAT_ID = process.env.CHAT_ID as string;

    this.SHOULD_EMIT_LIQUIDATION_EVENTS =
      (process.env.SHOULD_EMIT_LIQUIDATION_EVENTS as string) === 'true';

    this.SHOULD_FETCH_UNDERLYING_PRICE =
      (process.env.SHOULD_FETCH_UNDERLYING_PRICE as string) === 'true';

    this.SHOULD_SEND_TELEGRAM =
      (process.env.SHOULD_SEND_TELEGRAM as string) === 'true';

    this.validate();
  }

  validate() {
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

    if (isNaN(this.NORMAL_PRICE_ORACLE_START_BLOCK)) {
      throw new Error('Wrong NORMAL_PRICE_ORACLE_START_BLOCK env variable');
    }

    if (isNaN(this.BLOCK_FILTER_BATCH)) {
      throw new Error('Wrong BLOCK_FILTER_BATCH env variable');
    }

    if (isNaN(this.UNITROLLER_DEPLOYMENT_BLOCK)) {
      throw new Error('Wrong UNITROLLER_DEPLOYMENT_BLOCK env variable');
    }

    if (
      !this.LIQUIDATOR_CONTRACT_ADDRESS ||
      !this.LIQUIDATOR_CONTRACT_ADDRESS.startsWith('0x')
    ) {
      throw new Error('Wrong LIQUIDATOR_CONTRACT_ADDRESS env variable');
    }

    if (!this.BLOXROUTE_WS_URL) {
      throw new Error('Wrong BLOXROUTE_WS_URL env variable');
    }

    if (!this.BLOXROUTE_HTTPS_URL) {
      throw new Error('Wrong BLOXROUTE_HTTPS_URL env variable');
    }

    if (!this.BLOXROUTE_AUTH_HEADER) {
      throw new Error('Wrong BLOXROUTE_AUTH_HEADER env variable');
    }

    if (!this.FROM_ADDRESS) {
      throw new Error('Wrong FROM_ADDRESS env variable');
    }

    if (!this.PRIVATE_KEY) {
      throw new Error('Wrong PRIVATE_KEY env variable');
    }

    if (!this.FLASHBOTS_HTTPS_URL) {
      throw new Error('Wrong FLASHBOTS_HTTPS_URL env variable');
    }

    if (isNaN(this.MINIMUM_LIQUIDATION_VALUE)) {
      throw new Error('Wrong MINIMUN_LIQUIDATION_VALUE env variable');
    }

    if (!this.TG_BOT_TOKEN) {
      throw new Error('Wrong TG_BOT_TOKEN env variable');
    }

    if (!this.CHAT_ID) {
      throw new Error('Wrong CHAT_ID env variable');
    }

    if (this.SHOULD_FETCH_EXCHANGE_RATES === undefined) {
      throw new Error('Wrong SHOULD_FETCH_EXCHANGE_RATES env variable');
    }
  }
}

export default new Env();
