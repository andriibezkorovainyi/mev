// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;
// forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.sepolia.org --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
//98538ea1254ac21a5464507bf0f0c987200990c64566966a39c6ce8f62789cceaa

//forge script script/deploy.s.sol:DeployScript --rpc-url $RPC_SEPOLIA --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

import "../src/Comptroller.sol";
import "../src/SimplePriceOracle.sol";
import "../src/JumpRateModelV2.sol";
import "../test/mocks/USDT.sol";

import "../src/Interfaces/IERC3156FlashBorrower.sol";
import "../src/Interfaces/IERC20.sol";

import {Script, console} from "forge-std/Script.sol";

contract DeployScript is Script {

    Comptroller public comp = Comptroller(0xeD1be65B71ec045D14232C6ed80BDA227DB6F4f7);

    SimplePriceOracle oracle = SimplePriceOracle(0x16eCC704D4288BB0fb71f1eA11e7670b374F1a79);
    JumpRateModelV2 rateModel = JumpRateModelV2(0xD74cBD6A2564275cD93a101Dc2b2A047a7362CF6);
    USDT public wBTC;
    CErc20 public cwBTC;
    
    address public admin    = makeAddr("admin");
    address user1           = makeAddr("user1");        //LP of USDT
    address user2           = makeAddr("user2");        //LP of wBTC and borrow USDT


    function setUp() public {}

    function run() public {

        console2.log("Deploying");
        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        wBTC            = new USDT("wBTC","wBTC",18); //@note
        cwBTC           = new CErc20();

        console2.log("Address of cwBTC:", address(cwBTC));

        cwBTC.initialize(address(wBTC),comp,rateModel,0.02e28,"cwBTC","cwBTC",8); //@note

        oracle.setDirectPrice(address(wBTC),50_000e18); //@note

        comp._supportMarket(cwBTC); //@note
        comp._setCollateralFactor(cwBTC,1e17*7); //70% CF //@note
        vm.stopBroadcast();

             

    }

    // function setUPfillLiquidity() public {
        
    //     vm.startBroadcast(vm.envUint("PRIVATE_KEY-USER1"));
    //     usdt.mint(user1,100_000e18);
    //     usdt.approve(address(cUSDT),type(uint256).max);
    //     cUSDT.mint(100_000e18);
    //     vm.stopBroadcast();

    //     vm.startBroadcast(vm.envUint("PRIVATE_KEY-USER2"));
    //     wBTC.mint(user2,100_000e18);
    //     wBTC.approve(address(cwBTC),type(uint256).max);
    //     cwBTC.mint(1e18);
    //     vm.stopBroadcast();
    // }


}
