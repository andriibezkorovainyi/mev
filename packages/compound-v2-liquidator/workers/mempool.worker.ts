import MempoolModule from '../src/mempool/mempool.module.ts';

async function mempoolWorker() {
  let mempoolModule;

  try {
    mempoolModule = new MempoolModule();
    mempoolModule.messageService.init();
  } catch (error) {
    console.error('mempoolWorker -> error', error);
  }
}

mempoolWorker();
