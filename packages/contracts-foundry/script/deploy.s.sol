// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;
// forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.sepolia.org --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
//98538ea1254ac21a5464507bf0f0c987200990c64566966a39c6ce8f62789cceaa

//forge script script/deploy.s.sol:DeployScript --rpc-url $RPC_SEPOLIA --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

import "../src/Comptroller.sol";
import "../src/SimplePriceOracle.sol";
import "../src/JumpRateModelV2.sol";
import "../test/mocks/USDT.sol";
import "../test/mocks/wBTC.sol";

import "../src/Interfaces/IERC3156FlashBorrower.sol";
import "../src/Interfaces/IERC20.sol";

import {Script, console} from "forge-std/Script.sol";

contract DeployScript is Script {

    Comptroller public comp;
    SimplePriceOracle oracle;
    JumpRateModelV2 rateModel;
    USDT public usdt;
    WBTC public wBTC;
    CErc20 public cUSDT;
    CErc20 public cwBTC;
    
    address public admin    = makeAddr("admin");
    address user1           = makeAddr("user1");        //LP of USDT
    address user2           = makeAddr("user2");        //LP of wBTC and borrow USDT
    address liquidator      = makeAddr("liquidator");   //kill this party

    function setUp() public {}

    function run() public {

        console2.log("Deploying");
        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        usdt            = new USDT("USDT","USDT",18);
        wBTC            = new WBTC("wBTC","wBTC",8);
        comp            = new Comptroller();
        oracle          = new SimplePriceOracle();
        rateModel       = new JumpRateModelV2(67664919673264820,0,953226247647620500,9e17,admin);
        cUSDT           = new CErc20();
        cwBTC           = new CErc20();

        console2.log("Address of usdt:", address(usdt));
        console2.log("Address of wBTC:", address(wBTC));
        console2.log("Address of comp:", address(comp));
        console2.log("Address of oracle:", address(oracle));
        console2.log("Address of rateModel:", address(rateModel));
        console2.log("Address of cUSDT:", address(cUSDT));
        console2.log("Address of cwBTC:", address(cwBTC));


        cUSDT.initialize(address(usdt),comp,rateModel,0.02e28,"cUSDT","cUSDT",8);
        cwBTC.initialize(address(wBTC),comp,rateModel,0.02e28,"cwBTC","cwBTC",8);

        oracle.setDirectPrice(address(usdt),1e18);
        oracle.setDirectPrice(address(wBTC),50_000e18);
        comp._setPriceOracle(oracle);
        comp._supportMarket(cUSDT);
        comp._supportMarket(cwBTC);
        comp._setCollateralFactor(cUSDT,1e17*8); //80% CF
        comp._setCollateralFactor(cwBTC,1e17*7); //70% CF
        comp._setCloseFactor(5e17); 
        comp._setLiquidationIncentive(1080000000000000000); //1080000000000000000
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
