// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

interface ICErc20 {
    function balanceOf(address) external view returns(uint);
}