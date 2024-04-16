// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;
import "../../CToken.sol";

interface IOracle {
    function getUnderlyingPrice(CToken cToken) external view returns (uint);

}