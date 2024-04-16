// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "forge-std/Test.sol"; 

import {IMorpho, IMorphoBase } from "./Interfaces/Morpho/IMorpho.sol";
import {IMorphoFlashLoanCallback} from "./Interfaces/Morpho/IMorphoCallbacks.sol";
import {CTokenInterface, CErc20Interface} from "./Interfaces/CompoundV2/CTokenInterfaces.sol";
import {IUniswapV2Router02} from "./Interfaces/UniswapV2/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../src/Interfaces/IWETH.sol";
import {ICEther} from "../src/Interfaces/CompoundV2/ICEther.sol";
import {CToken} from "../src/CToken.sol";

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";


contract LiquidBot_v1 {

    using SafeERC20 for IERC20;
    
    string constant VERSION = "1";
    address public owner1;
    address public owner2; 
    address public offchain;
    address immutable morpho;
    ISwapRouter immutable swapRouter;
    
    address weth         = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address cETH         = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    uint256 validatorShare = 5000; //base 10000

    //underlying => does Morpho has it? if missed than true;
    // mapping (address => bool) private missedAtMorpho; 

    constructor(address _owner1, address _owner2, address _offchain, address _morpho, ISwapRouter _uniV3Router) {
        owner1         = _owner1;
        owner2         = _owner2;
        offchain       = _offchain;
        morpho         = _morpho;
        swapRouter    = _uniV3Router;
    }

    // function setMissedTokens(address[] calldata _missedTokens) public onlyOneOfOwners {
    //     uint tokensLen = _missedTokens.length;
    //     for (uint256 i; i < tokensLen; i++) {
    //         missedAtMorpho[_missedTokens[i]] = true;
    //     }

    // }

    function setApprove(address[] calldata _tokenAddress, address[] memory _target, uint256 _amount, bool _every2every) external onlyOneOfOwners {
        uint tokensLen = _tokenAddress.length;
        uint targetLen = _target.length;

        if (_every2every == false) {
            for (uint256 i; i < tokensLen; i++) {

                for (uint256 j; j < targetLen; j++) {
                    IERC20(_tokenAddress[i]).safeApprove(_target[j], _amount); 
                }
            }
        } else {
            for (uint256 i; i < tokensLen; i++) {
                IERC20(_tokenAddress[i]).safeApprove(_target[i], _amount); 
            }
        }
    }


    //if eth need to repay, need to pass in `_repayTokens` = weth
    function liquidate(
        address[] calldata _repayTokens,      //to pay native-debt-asset
        address[] calldata _cMarkets,         //cMarket with bad debt
        address[] calldata _borrowers,        //victim
        uint256[] calldata _repayAmounts,     //debt
        address[] calldata _cMarketCollaterals, //cMarket of collateral
        bytes[] calldata _path
        ) external onlyOffchain {            

        for(uint256 i = 0; i < _repayTokens.length; i++) {
            
            // if (missedAtMorpho[_repayTokens[i]] == false) {
                bytes memory FLdata = abi.encode(_repayTokens[i],_cMarkets[i],_borrowers[i],_repayAmounts[i],_cMarketCollaterals[i], _path[i]);
                IMorphoBase(morpho).flashLoan(_repayTokens[i],_repayAmounts[i], FLdata);   
            // } else {
            //     //2do
            // }
        }   

        for(uint256 i = 0; i < _repayTokens.length; i++) {
            _payToValidator(_repayTokens[i]); //@note need do update later with effective swap-path, not only direct repay tokens -> weth -> eth;
            _payToOwners(_repayTokens[i]);
        }

     }
    
    
    function onMorphoFlashLoan(uint256 _amount, bytes calldata FLdata) external {
        require(msg.sender == address(morpho));
        (address _repayToken, address _cMarket, address _borrower, uint256 _repayAmount, address _cMarketCollateral, bytes memory _path) = abi.decode(FLdata, (address,address,address,uint256,address,bytes));

        if (_repayToken == weth) {
            IWETH(weth).withdraw(_amount);
            ICEther(_cMarket).liquidateBorrow{value: _amount}(_borrower, CToken(_cMarketCollateral));
        } else {
            uint result = CErc20Interface(_cMarket).liquidateBorrow(_borrower,_repayAmount,CTokenInterface(_cMarketCollateral));   
            require(result == 0,"result !0");
        }


        if (_cMarketCollateral == cETH) {

            ICEther(_cMarketCollateral).redeem(ICEther(_cMarketCollateral).balanceOf(address(this)));
            IWETH(weth).deposit{value: (address(this).balance)}();
            uint256 amountOut = _swapExactInputMultihop(IERC20(weth).balanceOf(address(this)),abi.encodePacked(weth, uint24(3000), _repayToken));

        } else {
            
            CErc20Interface(_cMarketCollateral).redeem(CTokenInterface(_cMarketCollateral).balanceOf(address(this)));
            uint256 amountOut = _swapExactInputMultihop(IERC20(CErc20Interface(_cMarketCollateral).underlying()).balanceOf(address(this)), _path);
        }
    }

    function _swapExactInputMultihop(uint256 amountIn, bytes memory _path) internal returns (uint amountOut) {

        ISwapRouter.ExactInputParams memory params =
            ISwapRouter.ExactInputParams({
                path: _path,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0
            });

        amountOut = swapRouter.exactInput(params);

    }

    function _payToOwners(address _repayTokens) internal {

        
        IERC20(_repayTokens).transfer(owner1,IERC20(_repayTokens).balanceOf(address(this))/2);
        IERC20(_repayTokens).transfer(owner2,IERC20(_repayTokens).balanceOf(address(this)));

    
    }

    function _payToValidator(address _repayTokens) internal {

            if (_repayTokens == weth) {
                uint256 netProfitInTokens = IERC20(_repayTokens).balanceOf(address(this));
                uint256 toPayValidator    = netProfitInTokens * validatorShare / 10_000;
                IWETH(weth).withdraw(toPayValidator);
                block.coinbase.call{value: toPayValidator}(new bytes(0));
                
            } else {
                uint256 netProfitInTokens = IERC20(_repayTokens).balanceOf(address(this));
                uint256 toPayValidator    = netProfitInTokens * validatorShare / 10_000;
                uint256 amountOutWeth = _swapExactInputMultihop(toPayValidator,abi.encodePacked(_repayTokens, uint24(3000), weth));
                IWETH(weth).withdraw(amountOutWeth);
                block.coinbase.call{value: amountOutWeth}(new bytes(0));     
                console.log("Amount to validator: ", amountOutWeth);
            }
    
    }

    modifier onlyOffchain() {
        require(msg.sender == offchain);
        _;
    }

    //Ownership config
    modifier onlyOneOfOwners()  {
        require(msg.sender == owner1 || msg.sender == owner2);
        _;
    }

    function changeOwner1(address _newOwner1) external {
        require(msg.sender == owner1);
        owner1 = _newOwner1;
    }

    function changeOwner2(address _newOwner2) external {
        require(msg.sender == owner2);
        owner2 = _newOwner2;
    }

    function changeOffchain(address _offchain) external onlyOneOfOwners {
        offchain = _offchain;
    
    }

    function sweepToken(address _token, address _to, uint256 _amount) external onlyOneOfOwners {
        IERC20(_token).transfer(_to, _amount);
    }

    function sweepNative(address _to, uint256 _amount) external onlyOneOfOwners {
        _to.call{value: _amount}("");
    }

    function setvalidatorShare(uint256 _share) external onlyOneOfOwners {
        validatorShare = _share;
    }


    receive() external payable {}

}
