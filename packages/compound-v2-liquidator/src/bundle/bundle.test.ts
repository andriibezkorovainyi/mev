import { beforeAll, describe, it } from 'bun:test';
import type { BundleService } from './bundle.service.ts';
import MasterModule from '../master/master.module.ts';

describe('Bundle', () => {
  let bundleService: BundleService;

  beforeAll(async () => {
    // Env.PROTOCOL = ProtocolType.TEST_V2;

    const masterModule = new MasterModule(undefined as unknown as Worker);

    bundleService = masterModule.bundleModule.getService('bundleService');
  });

  it('should connect to bundle rpc by IP', async () => {
    // Env.BLOXROUTE_HTTPS_URL = 'https://mev.api.blxrbdn.com';
    // const smth = await bundleService.submitBundleBLXR(19619286, ['a', 'b']);
    //
    // console.log(smth);
  }, 600_000);

  it('should trace bundle', async () => {
    const result = await bundleService.traceBundle(
      '0xcf3531495b8f34498fd360420b5937d5aaf5fd7e6a758de6dd912fa2fb622c13',
    );

    console.log(result);
  }, 600_000);

  it('should validate bundle', async () => {
    // const result = await bundleService.validateBundleBLXR(19619386, [
    //   '0x02f90218012d830e5b6485151f6a70a28302b1e39415c905dec8da0a90fa05f8121e8f8285d30ef1f48705543df729c000b901a484bb1e42000000000000000000000000296e9bcf074275e619e33f9b3320afb21dcc397f0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000000110d9316ec00000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000110d9316ec000000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c001a04a4b11f20782a01b3eda7b5eb2f0537f556952e92d8e058a68998f0d07c73d7ca064e4b9fa2cf7af965f7f3cda9b47fa757f24c1380227abd7fc1710a92821aaaa',
    //   '0x02f86c01038529e8d60800852e90edd0008255f0947014852d523d70dd671cbcb1841fbd67109067258080c080a068f2b51fbe53c707a3c2abdaed622dbab246753be37b4f5ddec331a1a6bee138a07d1e26423e6de5c7d8cb9e3fae71255d66c565e15d1c332dd3cbf52ec0437428',
    // ]);
    //
    // console.log(result);
  }, 600_000);
});
