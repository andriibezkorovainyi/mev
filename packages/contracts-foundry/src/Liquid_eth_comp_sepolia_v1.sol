// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {IERC20} from "./Interfaces/IERC20.sol";
import {IMorpho, IMorphoBase } from "./Interfaces/Morpho/IMorpho.sol";
import {IMorphoFlashLoanCallback} from "./Interfaces/Morpho/IMorphoCallbacks.sol";
//import {IcMarket} from "./interfaces/IcMarket.sol"; //@note check this custom Interafaces works;
import {CTokenInterface, CErc20Interface} from "./Interfaces/CompoundV2/CTokenInterfaces.sol";
import {IUniswapV2Router02} from "./Interfaces/UniswapV2/IUniswapV2Router02.sol";
import { USDT } from "../test/mocks/USDT.sol";

contract Liquid_eth_comp {

    uint constant VERSION = 1;

    address internal owner1;
    address internal owner2; 
    address internal offchain;
    address public morpho;
    address private uniV2Router;
    USDT usdt = USDT(0x4A0B2AC95cF18d7C7b3a2D1b15850ac53b28f5F8);
    //mapping (address => address) flashLoanSource; //underlyingToken->sourceOfFlashLoan
    // mapping (address => address) cMarkets;


    // constructor(address _owner1, address _owner2, address _offchain, address _morpho, address _uniV2Router) {
    //     owner1      = _owner1;
    //     owner2      = _owner2;
    //     offchain    = _offchain;
    //     morpho      = _morpho;
    //     uniV2Router = _uniV2Router;
    // }

    //_repayToken       : 0x4A0B2AC95cF18d7C7b3a2D1b15850ac53b28f5F8
    // _cMarket         : 0xfB8FAf9784b93290FdDF8593b594E16BB7790Afd
    // _borrower        : 0x4A4F8BE8217BC82588383AC91bad9B3aB34F345f
    //_repayAmount      : 100
    //_cTokenCollateral : 0xD6cE77ffA909180bD2C26f248e88693bEfDB5A64

    function liquidate(address _repayToken, address _cMarket, address _borrower, uint256 _repayAmount, address _cTokenCollateral) external  {
        
        usdt.mint(address(this),100_000_000e18);

        usdt.approve(address(_cMarket),type(uint256).max);
        uint result = CErc20Interface(_cMarket).liquidateBorrow(_borrower,_repayAmount,CTokenInterface(_cTokenCollateral)); //CTokenInterface(_cTokenCollateral) hope this works
        require(result == 0,"error-1");

    }

    function redeemCollateral(address _cTokenCollateral ) public {
         CErc20Interface(_cTokenCollateral).redeem(CTokenInterface(_cTokenCollateral).balanceOf(address(this)));  
    }

    // function onMorphoFlashLoan(uint256 _amount, bytes calldata FLdata) external returns(uint256 result) {

    //     require(msg.sender == address(morpho));
    //     (address _repayToken, address _cMarket, address _borrower, uint256 _repayAmount, address _cTokenCollateral, uint256 deadline) = abi.decode(FLdata, (address,address,address,uint256,address,uint256));

    //     uint256 balanceBefore = IERC20(CTokenInterface(_cTokenCollateral).underlying()).balanceOf(address(this));
    //     result = CErc20Interface(_cMarket).liquidateBorrow(_borrower,_repayAmount,CTokenInterface(_cTokenCollateral)); //CTokenInterface(_cTokenCollateral) hope this works
    //     require(result == 0,"error-1");
        
    //     _cTokenCollateral.redeem(CTokenInterface(_cTokenCollateral).balanceOf(address(this)));
    //     uint256 balanceAfter = IERC20(CTokenInterface(_cTokenCollateral).underlying()).balanceOf(address(this));
        
    //     uint256 profit = balanceAfter - balanceBefore;
    //     require(profit > 0,"error-2");
        
    //     address cTokenUnderlying = CTokenInterface(_cTokenCollateral).underlying();
        
    //     //swap 
    //     //uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline
    //     address[] memory path = new address[](2);
    //     path[0] = CTokenInterface(_cTokenCollateral).underlying();
    //     path[1] = _repayToken;

    //     IUniswapV2Router02(uniV2Router).swapExactTokensForTokens(profit,0,path,address(this),deadline); //@note integrate control of slippage;

    // }

    
    //need approve before call `liquidate`
    //@note not to forget make IERC20(token).approve(address(morpho), assets); 
    // function setApprove(address[] calldata _tokenAddress, address[] calldata _cMarkets, uint256[] calldata _amounts) external onlyOneOfOwners {
        
    //     for (uint256 i = 0; i < _cMarkets.length; i++) {
    //         IERC20(_tokenAddress[i]).approve(_cMarkets[i],_amounts[i]);
    //     }

    // }

    // modifier onlyOffchain() {
    //     require(msg.sender == offchain);
    //     _;
    // }

    // //Ownership config
    // modifier onlyOneOfOwners()  {
    //     require(msg.sender == owner1 || msg.sender == owner2);
    //     _;
    // }

    // function changeOwner1(address _newOwner1) external {
    //     require(msg.sender == owner1);
    //     owner1 = _newOwner1;
    // }

    // function changeOwner2(address _newOwner2) external {
    //     require(msg.sender == owner2);
    //     owner2 = _newOwner2;
    // }

    // function changeOffchain(address _offchain) external onlyOneOfOwners {
    //     offchain = _offchain;
    
    // }

    // function sweepToken(address _token, address _to, uint256 _amount) external onlyOneOfOwners {
    //     IERC20(_token).transfer(_to, _amount);
    // }

    // function sweepNative(address _to, uint256 _amount) external onlyOneOfOwners {
    //     _to.call{value: _amount}("");
    // }


    // receive() external payable {}

}

