import MempoolModule from '../src/mempool/mempool.module.ts';

async function mempoolWorker() {
  let mempoolModule;

  try {
    mempoolModule = new MempoolModule();
  } catch (error) {
    console.error('mempoolWorker -> error', error);
  }

  await mempoolModule?.getService('mempoolService').init();

  // await new Promise((res) => setTimeout(res, 10000));
  console.log('mempoolWorker -> stop');
}

mempoolWorker();
