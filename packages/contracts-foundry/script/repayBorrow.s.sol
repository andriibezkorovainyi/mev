// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "../src/Comptroller.sol";
import "../src/SimplePriceOracle.sol";
import "../src/JumpRateModelV2.sol";
import "../test/mocks/USDT.sol";
import "../test/mocks/wBTC.sol";

import "../src/Interfaces/IERC3156FlashBorrower.sol";
import "../src/Interfaces/IERC20.sol";

import {Script, console} from "forge-std/Script.sol";

contract RepayBorrowScript is Script {
    Comptroller public comp = Comptroller(0xeD1be65B71ec045D14232C6ed80BDA227DB6F4f7);
    WBTC public wBTC = WBTC(0x922684dc03C9DDEdcF4661b8d0B612B3a112eCd3);
    CErc20 public cwBTC = CErc20(0xD6cE77ffA909180bD2C26f248e88693bEfDB5A64);

    CErc20 public cUSDT = CErc20(0xfB8FAf9784b93290FdDF8593b594E16BB7790Afd);
    USDT public usdt = USDT(0x4A0B2AC95cF18d7C7b3a2D1b15850ac53b28f5F8);

//    SimplePriceOracle oracle = SimplePriceOracle(0x16eCC704D4288BB0fb71f1eA11e7670b374F1a79);

//    address public admin = makeAddr("admin");
//    address user1 = makeAddr("user1"); //LP of USDT
//    address user2 = makeAddr("user2"); //LP of wBTC and borrow USDT

    function setUp() public {}

    function run() public {
        console2.log("RepayBorrow");
//        console2.log("Deployer key", vm.envUint("DEPLOYER_KEY"));
        vm.startBroadcast(vm.envUint("DEPLOYER_KEY")); //0x4A4F8BE8217BC82588383AC91bad9B3aB34F345f

//        usdt.approve(address(cUSDT), 2 ** 256 - 1);

        cUSDT.repayBorrow(1e24);
        //oracle.setDirectPrice(address(wBTC),1000e18);
//        vm.stopBroadcast();
    }
}
