
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {IERC20} "./interfaces/IERC20.sol";
import {IMorpho} from "./interfaces/IMorpho.sol";
import {IMorphoFlashLoanCallback} from "./interfaces/IMorphoCallbacks.sol";
import {IcMarket} "./interfaces/IcMarket.sol"; //@note check ша this custom Interaface works;
import {CTokenInterface} from "./interfaces/CTokenInterfaces.sol";

contract Liquid_eth_comp {

    uint constant VERSION = 1;
    address internal owner1;
    address internal owner2; 
    address internal offchain;
    address public morpho;
    // mapping (address => address) cMarkets;


    constructor(address _owner1, address _owner2, address _offchain, address _morpho) {
        owner1   = _owner1;
        owner2   = _owner2;
        offchain = _offchain;
        morho    = _morpho;
    }

    //need approve before call `liquidate`
    //@note not to forget make IERC20(token).approve(address(morpho), assets); 
    function setApprove(address[] calldata _underlyingToken, address[] calldata _cMarkets, uint256[] calldata _amounts) external onlyOneOfOwners {
        
        for (uint256 i = 0; i < _cMarkets.length; i++) {
            IERC20(_underlyingToken[i]).approve(_cMarkets[i],_amounts[i]);
        }

    }

    //@note to2: add source of flashLoan at offchain side to gas savings purposes and depends on source make 
    function liquidate(address _underlyingToken, address _cMarket, address _borrower, uint256 _repayAmount, address _cTokenCollateral) external onlyOffchain {
        bytes memory FLdata = abi.encode(_underlyingToken,_cMarket,_borrower,_repayAmount,_cTokenCollateral);
        IMorpho(morpho).flashloan(_underlyingToken,_repayAmount, bytes calldata FLdata);       


        //liquidatethan
        //returnFlashloan
    }

    function onMorphoFlashLoan(uint256 _amount, bytes calldata FLdata) external returns(uint256 result) {

        require(msg.sender == address(morpho));
        (address _underlyingToken, address _cMarket, address _borrower, uint256 _repayAmount, address _cTokenCollateral) = abi.decode(FLdata, (address,address,address,uint256,address));
        
        result = IcMarket(_cMarket).liquidateBorrow(_borrower,_repayAmount,CTokenInterface(_cTokenCollateral)); //CTokenInterface(_cTokenCollateral) hope this works

        //check out balancce after liquidation, if everything ok than continiun to swap liquidate amount
        //swap
        //transfer FL back

        IERC20(_underlyingToken).transfer(morpho,_repayAmount);

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
        _to.call{value: _amount}();
    }


    receive() external payable {}

}
