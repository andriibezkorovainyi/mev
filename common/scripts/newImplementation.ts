import { Web3 } from 'web3';

async function newImplementation() {
  const unitrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
  const eventAbiItem = {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldImplementation',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'NewImplementation',
    type: 'event',
  };
  const web3 = new Web3(
    'https://mainnet.infura.io/v3/4db6a4b8079f42f3b8cbccb7c7cdec7b',
  );
  const contract = new web3.eth.Contract([eventAbiItem], unitrollerAddress);

  const data = await contract.getPastEvents(
    'NewImplementation' as 'allEvents',
    {
      fromBlock: 'earliest',
      toBlock: 'latest',
    },
  );

  console.log(data);
}

newImplementation();
