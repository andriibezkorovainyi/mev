// // SPDX-License-Identifier: UNLICENSED
// //https://etherscan.io/tx/0xd0f82b2b53cfeba44e55113afca5957faa10f96cb404d942e4567a0e9d8a274c
// pragma solidity ^0.8.0;

// import "forge-std/Test.sol";
// import {Liquid_eth_comp} from "../src/Liquid_eth_comp.sol";
// import {IComptroller} from "../src/Interfaces/CompoundV2/IComptroller.sol";
// import {ICErc20} from "../src/Interfaces/CompoundV2/ICErc20.sol";
// import "../src/SimplePriceOracle.sol";

// contract LiquidTest is Test {

//     Liquid_eth_comp liquidator;
//     SimplePriceOracle oracle;

//     address public owner1         = makeAddr("owner1");
//     address public owner2         = makeAddr("owner2");
//     address public offchain       = makeAddr("offchain");
//     address public morpho         = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
//     address public uniV2Router    = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

//     address public victim         = 0xFeECA8db8b5f4Efdb16BA43d3D06ad2F568a52E3;
//     address public cUSDC          = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;

//     address public comptroller    = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
//     address public compAdmin      = 0x6d903f6003cca6255D85CcA4D3B5E5146dC33925;

   


//     function setUp() public {

//         vm.createSelectFork("ETH",19473812); //19473813-1
//         liquidator = new Liquid_eth_comp(owner1,owner2,offchain,morpho,uniV2Router);   

//         vm.startPrank(compAdmin);
//         oracle = new SimplePriceOracle();
//         comptroller._setPriceOracle(address(oracle));
//         oracle.setDirectPrice(asset, price);
//     }


//     function testBorrowAndLiquidate() public {

//         console2.log(StdStyle.red("---Balances before borrow---"));
//         (,uint liquidity, uint shortfall) = IComptroller(comptroller).getAccountLiquidity(victim);
//         console.log(liquidity,shortfall);
//         consoleMe();
//         console.log("cUSDC.balanceOf(victim)",ICErc20(cUSDC).balanceOf(victim));

//         // 150430497876163571390-19473812
//         // 2400605297235063615547-19473813


//     }

//     function consoleMe() public {
//         // emit log_named_decimal_uint("user2    wBTC balance:               ", wBTC.balanceOf(user2), wBTC.decimals());
//         // emit log_named_decimal_uint("user2    cwBTC balance:              ", cwBTC.balanceOf(user2), cwBTC.decimals());
//         // emit log_named_decimal_uint("user2    USDT balance:               ", usdt.balanceOf(user2), usdt.decimals());

//         // emit log_named_decimal_uint("liquidator    wBTC balance:          ", wBTC.balanceOf(liquidator), wBTC.decimals());
//         // emit log_named_decimal_uint("liquidator    cwBTC balance:         ", cwBTC.balanceOf(liquidator), cwBTC.decimals());
//         // emit log_named_decimal_uint("liquidator    USDT balance:          ", usdt.balanceOf(liquidator), usdt.decimals());

//         // emit log_named_decimal_uint("cUSDT    USDT balance:               ", usdt.balanceOf(address(cUSDT)), usdt.decimals());
        
//   }

// }








