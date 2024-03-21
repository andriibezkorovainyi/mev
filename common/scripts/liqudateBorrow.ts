import { Web3 } from 'web3/lib/types';

async function liqudateBorrow() {
  const address = '0x39AA39c021dfbaE8faC545936693aC917d5E7563'; // cUSDC
  const abitItem = {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'liquidator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'borrower',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'repayAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'cTokenCollateral',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'seizeTokens',
        type: 'uint256',
      },
    ],
    name: 'LiquidateBorrow',
    type: 'event',
  };

  const web3 = new Web3(
    'https://mainnet.infura.io/v3/4db6a4b8079f42f3b8cbccb7c7cdec7b',
  );

  const contract = new web3.eth.Contract([abitItem], address);

  const latestBlock = await web3.eth.getBlockNumber();

  const events = await contract.getPastEvents('LiquidateBorrow', {
    fromBlock: Number(latestBlock) - 1_000_000,
    toBlock: 'latest',
  });

  console.log(events);
}

liqudateBorrow();
