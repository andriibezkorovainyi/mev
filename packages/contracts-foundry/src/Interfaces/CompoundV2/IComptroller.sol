// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

interface IComptroller {
    function getAccountLiquidity(address) external view returns(uint,uint,uint);
    function _setPriceOracle(address) external;
}