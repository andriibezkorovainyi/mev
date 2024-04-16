import { NetworkNameType, NetworkType, ProtocolType } from './types/enums.ts';

export class EnvCommon {
  public NETWORK: NetworkType;
  public NETWORK_NAME: NetworkNameType;
  public PROTOCOL: ProtocolType;
  public HTTPS_RPC_URL: string;
  public WSS_RPC_URL: string;

  constructor() {
    this.NETWORK = process.env.NETWORK as NetworkType;
    this.NETWORK_NAME = process.env.NETWORK_NAME as NetworkNameType;
    this.HTTPS_RPC_URL = process.env.HTTPS_RPC_URL as string;
    this.WSS_RPC_URL = process.env.WSS_RPC_URL as string;
    this.PROTOCOL = process.env.PROTOCOL as ProtocolType;

    this.validateCommon();
  }

  validateCommon() {
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

    if (
      !this.PROTOCOL ||
      !Object.values(ProtocolType).some((v) => v === this.PROTOCOL)
    ) {
      throw new Error('Wrong PROTOCOL env variable');
    }
  }
}
