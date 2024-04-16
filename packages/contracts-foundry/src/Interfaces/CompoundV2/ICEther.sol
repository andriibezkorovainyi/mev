// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;
import "../../CToken.sol";

interface ICEther {
    function liquidateBorrow(address,  CToken) external payable;
    function balanceOf(address) external view returns(uint);
    function redeem(uint) external returns (uint);
}