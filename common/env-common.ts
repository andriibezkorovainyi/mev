import { NetworkNameType, NetworkType } from './types/enums.ts';

export class EnvCommon {
  public readonly NETWORK: NetworkType;
  public readonly NETWORK_NAME: NetworkNameType;
  public readonly HTTPS_RPC_URL: string;
  public readonly WSS_RPC_URL: string;

  constructor() {
    this.NETWORK = process.env.NETWORK as NetworkType;
    this.NETWORK_NAME = process.env.NETWORK_NAME as NetworkNameType;
    this.HTTPS_RPC_URL = process.env.HTTPS_RPC_URL as string;
    this.WSS_RPC_URL = process.env.WSS_RPC_URL as string;

    if (!this.HTTPS_RPC_URL) {
      throw new Error('Wrong HTTPS_RPC_URL env variable');
    }

    if (!this.WSS_RPC_URL) {
      throw new Error('Wrong WSS_RPC_URL env variable');
    }

    if (
      !this.NETWORK ||
      !Object.values(NetworkType).some((v) => v === this.NETWORK)
    ) {
      throw new Error('Wrong NETWORK env variable');
    }

    if (
      !this.NETWORK_NAME ||
      !Object.values(NetworkNameType).some((v) => v === this.NETWORK_NAME)
    ) {
      throw new Error('Wrong NETWORK_NAME env variable');
    }
  }
}
