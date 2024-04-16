// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Swapper.sol";
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';


contract SwapperTest is Test {

    SwapExamples sc;
    ISwapRouter router;

    address uniV3Router1 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    //address uniV3Router2 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

    address public DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;


    function setUp() public {

        vm.createSelectFork("ETH",19638210);
        //router = ISwapRouter(uniV3Router2);    
        sc = new SwapExamples(uniV3Router1);

        //deal(DAI,address(sc),2_069_710_204683734642613772);
        deal(WETH9,address(sc),100e18);

        //TransferHelper.safeApprove(DAI, address(sc), type(uint256).max);
        

    }

    function testSwap() public {
        console.log("DAI  balance:", IERC20(DAI).balanceOf(address(sc)));
        console.log("wETH balance:", IERC20(WETH9).balanceOf(address(sc)));
        console.log("USDC balance:", IERC20(USDC).balanceOf(address(sc)));
        bytes memory path = abi.encodePacked(WETH9, uint24(3000), 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, uint24(100), 0x6B175474E89094C44Da98b954EedeAC495271d0F);
        sc.swapExactInputMultihop(100e18,path);
        console.log("DAI  balance:", IERC20(DAI).balanceOf(address(sc)));
        console.log("wETH balance:", IERC20(WETH9).balanceOf(address(sc)));
        console.log("USDC balance:", IERC20(USDC).balanceOf(address(sc)));
    }

}


  
       