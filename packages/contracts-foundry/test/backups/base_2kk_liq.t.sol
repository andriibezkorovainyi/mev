// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// import "forge-std/Test.sol";
// import {IMorpho, IMorphoBase} from "../src/Interfaces/Morpho/IMorpho.sol";
// import "../src/LiquidBot_v1.sol";
// import {Comptroller} from "../src/Comptroller.sol"; //@note
// import {IComptroller} from "../src/Interfaces/CompoundV2/IComptroller.sol"; //@note
// import {ICErc20} from "../src/Interfaces/CompoundV2/ICErc20.sol"; //@note
// import {SimplePriceOracle} from  "../src/SimplePriceOracle.sol";
// import {IOracle} from "../src/Interfaces/CompoundV2/IOracle.sol";
// import {CToken} from "../src/CToken.sol";

// contract LiquidBot_v1Test is Test {

//     address owner1      = makeAddr("owner1");
//     address owner2      = makeAddr("owner2");
//     address offchain    = makeAddr("offchain");

//     address morpho       = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
//     address dai          = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
//     address wBTC         = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
//     address usdt         = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
//     address weth         = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
//     address usdc         = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

//     address uniV3Router1 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
//     address uniV3Router2 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

//     address cwBTC        = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;
//     address cUSDT        = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;
//     address cUSDC        = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
//     address cETH         = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

//     address public comptroller    = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B; //@note
//     address public compAdmin      = 0x6d903f6003cca6255D85CcA4D3B5E5146dC33925; //@note
//     address public victim         = 0x4bbC507Ca4417625E20199644523f4D92df927b1; //@note
//     address public realOracle     = 0x50ce56A3239671Ab62f185704Caedf626352741e; //@note
//     SimplePriceOracle oracle;                                                   //@note

//     CToken cDAI                  = CToken(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);
//     CToken cCOMP                 = CToken(0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4);
//     CToken cZRX                  = CToken(0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407);

//     LiquidBot_v1 bot;
//     ISwapRouter swapRouter = ISwapRouter(uniV3Router1);


//     function setUp() public {

//         vm.createSelectFork("ETH",19411106);
//         bot             = new LiquidBot_v1(owner1,owner2,offchain,morpho,swapRouter);
        
//         vm.startPrank(owner1);
//         bot.setFLsource(dai, morpho);
//         bot.setFLsource(usdt, morpho);
//         bot.setFLsource(usdc, morpho);
//         bot.setFLsource(weth, morpho);
//         setApprove();
//         vm.stopPrank();

//         //@note
//         vm.startPrank(compAdmin);                      
//         oracle = new SimplePriceOracle();
//         IComptroller(comptroller)._setPriceOracle(address(oracle));

//         oracle.setUnderlyingPrice(CToken(cETH), 4040210951000000000000);
//         oracle.setUnderlyingPrice(CToken(cDAI), IOracle(realOracle).getUnderlyingPrice(CToken(cDAI)));
//         //liquidity of victim: 11_207_178186677223401879

//         vm.stopPrank();
//     }

//     function testLiquidate() public {

//         address[] memory _repayTokens       = new address[](1);
//         _repayTokens[0] = weth;
//         address[] memory _cMarkets          = new address[](1);
//         _cMarkets[0] = cETH;
//         address[] memory _borrowers         = new address[](1);
//         _borrowers[0] = victim;
//         uint256[] memory _repayAmounts      = new uint256[](1);
//         _repayAmounts[0] = 488e18;
//         address[] memory _cTokenCollaterals = new address[](1);
//         _cTokenCollaterals[0] = address(cDAI);
        
//         vm.startPrank(offchain);
//         (, uint liquidity, uint shortfall) = IComptroller(comptroller).getAccountLiquidity(victim);
//         console.log("victim: Liquidity", liquidity);
//         console.log("victim: Shortfall", shortfall);

//         bytes[] memory path = new bytes[](1);
//         path[0] = abi.encodePacked(dai, uint24(100), usdc, uint24(3000), weth);
//         bot.liquidate(_repayTokens,_cMarkets,_borrowers,_repayAmounts,_cTokenCollaterals,path);
//         console.log("DAI  balance:", IERC20(dai).balanceOf(address(bot)));
//         console.log("wETH balance:", IERC20(weth).balanceOf(address(bot)));
//         console.log("USDC balance:", IERC20(usdc).balanceOf(address(bot)));
//     }



//     function consoleMe() public {
//         //emit log_named_decimal_uint("user2    wBTC balance:               ", wBTC.balanceOf(user2), wBTC.decimals());
//     }

//     function setApprove() internal {
//         address[] memory tokens = new address[](4);
//         tokens[0] = usdt;
//         tokens[1] = usdc;
//         tokens[2] = dai;
//         tokens[3] = weth;
//         bot.setApprove(tokens,morpho,type(uint256).max);
//         bot.setApprove(tokens,address(uniV3Router1),type(uint256).max);
//         bot.setApprove(tokens,address(uniV3Router2),type(uint256).max);
//         bot.setApprove(tokens,cETH,type(uint256).max);
//         bot.setApprove(tokens,cUSDC,type(uint256).max);
//         //bot.setApprove(tokens,address(cDAI),type(uint256).max);
        
//     }
// }



// // 0xE592427A0AEce92De3Edee1F18E0157C05861564
// // [259960] SwapRouter::exactInput(ExactInputParams({ path: 0x6b175474e89094c44da98b954eedeac495271d0f000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, recipient: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, deadline: 1710151067 [1.71e9], amountIn: 100000000000000000000 [1e20], amountOutMinimum: 0 }))
// // [7327]   SwapRouter::exactInput(ExactInputParams({ path: 0x6b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000000000000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, recipient: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb, deadline: 1710151067 [1.71e9], amountIn: 100000000000000000000 [1e20], amountOutMinimum: 0 }))