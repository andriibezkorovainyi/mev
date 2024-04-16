import { Web3 } from 'web3';
import cToken from '../compound-protocol/artifacts/CToken.sol/CToken.json';

async function uniswapAnchoredViewPriceUpdat() {
  const cTokenAddress = '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5'; // cUSDC
  // const anchoredViewAddress = '0x50ce56A3239671Ab62f185704Caedf626352741e'; // AnchoredView
  // const aaveValidatorProxy = '0x0238247E71AD0aB272203Af13bAEa72e99EE7c3c';
  // const aaveAccessControlledOffchainAggregator =
  //   '0x8116B273cD75d79C382aFacc706659DEd5E0a59d';
  // const uniswapAnchoredViewAddress =
  //   '0x50ce56A3239671Ab62f185704Caedf626352741e';

  const liquidateBorrowEventItem = cToken.abi.find(
    (item) => item.name === 'LiquidateBorrow',
  )!;

  // const priceUpdatedEventItem = [
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: 'bytes32',
  //         name: 'symbolHash',
  //         type: 'bytes32',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'uint256',
  //         name: 'price',
  //         type: 'uint256',
  //       },
  //     ],
  //     name: 'PriceUpdated',
  //     type: 'event',
  //   },
  // ];
  // const newTransmissionEventItem = [
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: 'uint32',
  //         name: 'aggregatorRoundId',
  //         type: 'uint32',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'int192',
  //         name: 'answer',
  //         type: 'int192',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'address',
  //         name: 'transmitter',
  //         type: 'address',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'int192[]',
  //         name: 'observations',
  //         type: 'int192[]',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'bytes',
  //         name: 'observers',
  //         type: 'bytes',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'bytes32',
  //         name: 'rawReportContext',
  //         type: 'bytes32',
  //       },
  //     ],
  //     name: 'NewTransmission',
  //     type: 'event',
  //   },
  // ];

  // const priceUpdatedEventItem = [
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: 'bytes32',
  //         name: 'symbolHash',
  //         type: 'bytes32',
  //       },
  //       {
  //         indexed: false,
  //         internalType: 'uint256',
  //         name: 'price',
  //         type: 'uint256',
  //       },
  //     ],
  //     name: 'PriceUpdated',
  //     type: 'event',
  //   },
  // ];

  // if (!priceUpdatedEventItem) {
  //   throw new Error(
  //     'Could not find PriceUpdated event in UniswapAnchoredView ABI',
  //   );
  // }

  // if (!liquidateBorrowEventItem) {
  //   throw new Error('Could not find LiquidateBorrow event in CToken ABI');
  // }

  const web3 = new Web3(
    'https://eth-mainnet.g.alchemy.com/v2/Kpg100POT3vj4JVGz-PNIRn6NjWyNEtx',
  );
  const cTokenContract = new web3.eth.Contract(cToken.abi, cTokenAddress);
  // const uniswapAnchoredViewContract = new web3.eth.Contract(
  //   priceUpdatedEventItem,
  //   uniswapAnchoredViewAddress,
  // );

  // Получение номера последнего блока
  const latestBlock = await web3.eth.getBlockNumber();

  // Поиск событий LiquidateBorrow за последние 1000 блоков
  const events = await cTokenContract.getPastEvents(
    'LiquidateBorrow' as 'allEvents',
    {
      fromBlock: Number(latestBlock) - 1_000_000,
      toBlock: 'latest',
    },
  );

  // console.log(events);
  // const events = await cTokenContract.getPastEvents(
  //   'PriceUpdated' as 'allEvents',
  //   {
  //     // fromBlock: 19161410,
  //     fromBlock: 19161330,
  //     toBlock: 19161539,
  //   },
  // );

  console.log(events);
}

uniswapAnchoredViewPriceUpdat();
