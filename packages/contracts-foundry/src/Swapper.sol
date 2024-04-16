// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.0;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '../src/Interfaces/UniswapV2/IV3SwapRouter.sol'; 

contract SwapExamples {


    ISwapRouter public immutable swapRouter;



    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address usdt         = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // For this example, we will set the pool fee to 0.3%.
    uint24 public constant poolFee = 3000;

    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
    }


    // //@note for router2
    // function swapExactInputMultihop(uint256 amountIn) external returns (uint256 amountOut) {
    //     // Transfer `amountIn` of DAI to this contract.
    //     //TransferHelper.safeTransferFrom(DAI, msg.sender, address(this), amountIn);

    //     // Approve the router to spend DAI.
    //     TransferHelper.safeApprove(DAI, address(swapRouter), amountIn);

    //     IV3SwapRouter.ExactInputParams memory params =
    //         IV3SwapRouter.ExactInputParams({
    //             path: abi.encodePacked(DAI, uint24(1000), USDC, poolFee, WETH9),
    //             recipient: msg.sender,
    //             amountIn: amountIn,
    //             amountOutMinimum: 0
    //         });

    //     // Executes the swap.
    //     amountOut = swapRouter.exactInput(params);
    // }

    //@note for router1
    // function swapExactInputMultihop(uint256 amountIn) external returns (uint256 amountOut) {
    //     // Transfer `amountIn` of DAI to this contract.
    //     //TransferHelper.safeTransferFrom(DAI, msg.sender, address(this), amountIn);

    //     // Approve the router to spend DAI.
    //     TransferHelper.safeApprove(DAI, address(swapRouter), amountIn);

    //     ISwapRouter.ExactInputParams memory params =
    //         ISwapRouter.ExactInputParams({
    //             path: abi.encodePacked(DAI, uint24(100), USDC, poolFee, WETH9),
    //             recipient: address(this),
    //             deadline: block.timestamp,
    //             amountIn: amountIn,
    //             amountOutMinimum: 100e18
    //         });

    //     // Executes the swap.
    //     amountOut = swapRouter.exactInput(params);
    // }


    function swapExactInputMultihop(uint256 amountIn, bytes memory _path) external returns (uint256 amountOut) {
        // Transfer `amountIn` of DAI to this contract.
        //TransferHelper.safeTransferFrom(DAI, msg.sender, address(this), amountIn);

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountIn);

        ISwapRouter.ExactInputParams memory params =
            ISwapRouter.ExactInputParams({
                path: _path,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 1
            });

        // Executes the swap.
        amountOut = swapRouter.exactInput(params);
    }

}