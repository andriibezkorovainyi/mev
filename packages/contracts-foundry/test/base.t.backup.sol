// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// import "forge-std/Test.sol";
// import "../src/Comptroller.sol";
// import "../src/SimplePriceOracle.sol";
// import "../src/JumpRateModelV2.sol";
// import "./mocks/USDT.sol";
// import "./mocks/wBTC.sol";

// import "../src/Interfaces/IERC3156FlashBorrower.sol";
// import "../src/Interfaces/IERC20.sol";

// //0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496 foundry test address
// contract CompoundTest is Test {

//     Comptroller public comp;
//     SimplePriceOracle oracle;
//     JumpRateModelV2 rateModel;
//     USDT public usdt;
//     // WBTC public wBTC;
//     // CErc20 public cUSDT;
//     CErc20 public cwBTC;
    
//     address public admin    = makeAddr("admin");
//     address user1           = makeAddr("user1");        //LP of USDT
//     address user2           = makeAddr("user2");        //LP of wBTC and borrow USDT
//     address liquidator      = makeAddr("liquidator");   //kill this party

//     function setUp() public {

//         vm.startPrank(admin);
//         usdt            = new USDT("USDT","USDT",18);
//         wBTC            = new WBTC("wBTC","wBTC",8);
//         comp            = new Comptroller();
//         oracle          = new SimplePriceOracle();
//         rateModel       = new JumpRateModelV2(67664919673264820,0,953226247647620500,9e17,admin);
//         cUSDT           = new CErc20();
//         cwBTC           = new CErc20();
//         console.log("admin",admin);
//         vm.stopPrank();
        
//         // vm.startPrank(admin);
//         cUSDT.initialize(address(usdt),comp,rateModel,0.02e28,"cUSDT","cUSDT",8);
//         cwBTC.initialize(address(wBTC),comp,rateModel,0.02e28,"cwBTC","cwBTC",8);
 
//         vm.startPrank(admin);
//         oracle.setDirectPrice(address(usdt),1e18);
//         oracle.setDirectPrice(address(wBTC),50_000e18);
//         comp._setPriceOracle(oracle);
//         comp._supportMarket(cUSDT);
//         comp._supportMarket(cwBTC);
//         comp._setCollateralFactor(cUSDT,1e17*8); //80% CF
//         comp._setCollateralFactor(cwBTC,1e17*7); //70% CF
//         comp._setCloseFactor(5e17); 
//         comp._setLiquidationIncentive(1080000000000000000); //1080000000000000000
//         vm.stopPrank();

//         setUPfillLiquidity(); //provide liquidity to markets;

//     }

//     function setUPfillLiquidity() public {
        
//         vm.startPrank(user1);
//         deal(address(usdt),user1,100_000e18);
//         usdt.approve(address(cUSDT),type(uint256).max);
//         cUSDT.mint(100_000e18);
//         vm.stopPrank();

//         vm.startPrank(user2);
//         deal(address(wBTC),user2,1e18);
//         wBTC.approve(address(cwBTC),type(uint256).max);
//         cwBTC.mint(1e18);
//         vm.stopPrank();
//     }



//     function testBorrowAndLiquidate() public {

//         console2.log(StdStyle.red("---Balances before borrow---"));
//         consoleMe();

//         //borrow
//         vm.startPrank(user2);
//         address[] memory cMarkets = new address[](1);
//         cMarkets[0]               = address(cwBTC);
//         comp.enterMarkets(cMarkets);
//         cUSDT.borrow(35_000e18);
//         console2.log(StdStyle.red("---Balances after borrow---"));
//         consoleMe();

//         //changePrice
//         vm.startPrank(admin);
//         oracle.setDirectPrice(address(wBTC),45_000e18);

//         //liquidate
//         vm.startPrank(liquidator);
//         deal(address(usdt),liquidator,35_000e18);
//         usdt.approve(address(cUSDT),type(uint256).max);

//         (, uint liquidity, uint shortfall) = comp.getAccountLiquidity(user2);
//         console.log("user2: Liquidity", liquidity);
//         console.log("user2: Shortfall", shortfall);
//         cUSDT.liquidateBorrow(user2,35000e18/2,cwBTC);
//         cwBTC.redeem(cwBTC.balanceOf(liquidator));

//         console2.log(StdStyle.red("---Balances after liquidate---"));
//         consoleMe();

//     }

//     function consoleMe() public {
//         emit log_named_decimal_uint("user2    wBTC balance:               ", wBTC.balanceOf(user2), wBTC.decimals());
//         emit log_named_decimal_uint("user2    cwBTC balance:              ", cwBTC.balanceOf(user2), cwBTC.decimals());
//         emit log_named_decimal_uint("user2    USDT balance:               ", usdt.balanceOf(user2), usdt.decimals());

//         emit log_named_decimal_uint("liquidator    wBTC balance:          ", wBTC.balanceOf(liquidator), wBTC.decimals());
//         emit log_named_decimal_uint("liquidator    cwBTC balance:         ", cwBTC.balanceOf(liquidator), cwBTC.decimals());
//         emit log_named_decimal_uint("liquidator    USDT balance:          ", usdt.balanceOf(liquidator), usdt.decimals());

//         emit log_named_decimal_uint("cUSDT    USDT balance:               ", usdt.balanceOf(address(cUSDT)), usdt.decimals());
        
//   }

// }







