// SPDX-License-Identifier: WTFPL
pragma solidity ^0.8.0;

import "./ERC20.sol";

contract USDT is ERC20 {
    constructor(string memory name,string memory symbol,uint8 decimals) public ERC20(name, symbol,decimals) {
        
    }


    function mint(address _to, uint256 _amount) external {
        _mint(_to,_amount);
    }
}