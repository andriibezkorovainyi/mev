import { Service } from '../../utils/classes/service.ts';
import Env from '../../utils/constants/env.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { Web3Service } from '../web3/web3.service.ts';

export class BundleService extends Service {
  constructor(private readonly web3Service: Web3Service) {
    super();
  }

  async testBundleTxs([tokenConfig, rawOriginTx]: [TokenConfigEntity, string]) {
    console.log('method -> liquidatorService.testBundleTxs');

    const blockNumber = (await this.web3Service.getNetworkHeight()) + 1;

    console.log('blockNumber', blockNumber);

    const rawTestTx = await this.web3Service.createRawTestTx();

    console.log('rawOriginTx', rawOriginTx);
    console.log('rawTestTx', rawTestTx);

    const bundleHash = await this.submitBundleBLXR(blockNumber, [
      rawOriginTx,
      rawTestTx,
    ]);

    console.log('bundleHash', bundleHash);
  }

  async submitBundleBLXR(blockNumber: number, txs: string[]) {
    console.log('method -> liquidatorService.submitBundle');
    const body = JSON.stringify({
      method: 'blxr_submit_bundle',
      id: '1',
      params: {
        block_number: '0x' + blockNumber.toString(16),
        transaction: txs,
        mev_builders: { all: '' },
      },
    });

    const response = await fetch(Env.BLOXROUTE_HTTPS_URL, {
      method: 'POST',
      tls: {
        rejectUnauthorized: false,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: Env.BLOXROUTE_AUTH_HEADER,
      },
      body,
    });
    const data = await response.json();

    // @ts-ignore
    const bundleHash = data.result?.bundleHash;

    if (!response.ok || !bundleHash) {
      // @ts-ignore
      throw new Error(data?.error?.message || JSON.stringify(data));
    }

    return bundleHash;
  }

  async sendBundleFB(blockNumber: number, txs: string[]) {
    console.log('method -> liquidatorService.sendBundle');
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendBundle',
      params: [
        {
          txs,
          blockNumber: '0x' + blockNumber.toString(16),
        },
      ],
    });

    const flashbotsSignature =
      await this.web3Service.getFlashbotsSignature(body);

    let response: typeof Response;
    try {
      // @ts-ignore
      response = await fetch(Env.FLASHBOTS_HTTPS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flashbots-Signature': flashbotsSignature,
        },
        body,
      });

      return response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async callBundleFB(blockNumber: number, txs: string[]) {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_callBundle',
      params: [
        {
          txs,
          blockNumber: '0x' + blockNumber.toString(16),
          stateBlockNumber: 'latest',
        },
      ],
    });
    const flashbotsSignature =
      await this.web3Service.getFlashbotsSignature(body);

    console.log('flashbotsSignature', flashbotsSignature);

    let response: typeof Response;

    try {
      // @ts-ignore
      response = await fetch(Env.FLASHBOTS_HTTPS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flashbots-Signature': flashbotsSignature,
        },
        body,
      });

      return response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async traceBundle(bundleHash: string) {
    console.log('method -> liquidatorService.traceBundle');

    let response: any;
    try {
      response = await fetch(
        `https://tools.bloxroute.com/ethbundletrace/${bundleHash}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Authorization:
            //   'ZWYxMjczOWItYmQyYS00NGU3LWFjMzMtNzY2YWQ2NGM3NmQ0OjAzZmFjMTU3ZjQyY2E4ZTQ1MjkyODk0ZDE3ZGIzOTI2',
            // Authorization:
            //   'MGU5NGI1ZWYtYWE2OC00YmE4LWIwNmMtNjZjNzhkNmY5NjcxOjNkZjZmN2MwMDhiNGVjZjZkZmY3ZTE0ZjdhYmJkYWY3',
            // Authorization: Env.BLOXROUTE_AUTH_HEADER,
            // Authorization:
            //   'NzdiNWYwNmItNTA3OC00ZWVkLTk4M2QtODQ0OWE3ZmI4ODMxOmE1NTE2ZGQyMDA2ZTkwNWRkY2Q2MThhZjk0NmRjOGJi',
            // Authorization:
            //   'ZmZkZjFiYWMtMTE1ZC00ZDU4LWI0ZDEtNGQwYWY5NGMyOGYyOmU2ZmZjOWRmNDNhNGJlN2NiODZhY2Y1ZTdhZTZkNjdh',
            Authorization:
              'MzBjYTJiY2ItN2MwNS00NzMwLTllMDEtOWYxN2RhZjFmNDBkOjJhNTY5Yzk5M2M2N2FiNjg5NDc2YzE2ZDUxMjdmMzU0',
          },
        },
      );
    } catch (error) {
      console.error(error);
    }

    return await response.json();
  }

  async validateBundleBLXR(blockNumber: number, txs: string[]) {
    // console.log(
    //   new URL(
    //     `https://tools.bloxroute.com/bundlevalidation?block_number=0x${blockNumber.toString(16)}` +
    //       `&transaction=${txs.join(',')}` +
    //       `&auth_header=ZmZkZjFiYWMtMTE1ZC00ZDU4LWI0ZDEtNGQwYWY5NGMyOGYyOmU2ZmZjOWRmNDNhNGJlN2NiODZhY2Y1ZTdhZTZkNjdh`,
    //   ).href,
    // );
    const auth =
      'MGU5NGI1ZWYtYWE2OC00YmE4LWIwNmMtNjZjNzhkNmY5NjcxOjNkZjZmN2MwMDhiNGVjZjZkZmY3ZTE0ZjdhYmJkYWY3';
    // 'MzBjYTJiY2ItN2MwNS00NzMwLTllMDEtOWYxN2RhZjFmNDBkOjJhNTY5Yzk5M2M2N2FiNjg5NDc2YzE2ZDUxMjdmMzU0';
    // Env.BLOXROUTE_AUTH_HEADER;
    // 'ZmZkZjFiYWMtMTE1ZC00ZDU4LWI0ZDEtNGQwYWY5NGMyOGYyOmU2ZmZjOWRmNDNhNGJlN2NiODZhY2Y1ZTdhZTZkNjdh';

    try {
      const response = await fetch(
        `https://tools.bloxroute.com/bundlevalidation?block_number=0x${blockNumber.toString(16)}` +
          `&transaction=${txs.join(',')}` +
          `&auth_header=${auth}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth,
          },
        },
      );

      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }
}
