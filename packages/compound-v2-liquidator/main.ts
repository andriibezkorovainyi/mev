import MasterModule from './src/master/master.module.ts';

async function main() {
  const mempoolWorkerUrl = new URL('workers/mempool.worker.ts', import.meta.url)
    .href;
  const mempoolWorker = new Worker(mempoolWorkerUrl);
  // const mempoolWorker = undefined as unknown as Worker;

  const masterModule = new MasterModule(mempoolWorker);
  await masterModule.getService('masterService').init();
}

main();
