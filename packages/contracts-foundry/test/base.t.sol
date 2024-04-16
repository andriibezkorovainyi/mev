// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {IMorpho, IMorphoBase} from "../src/Interfaces/Morpho/IMorpho.sol";
import "../src/LiquidBot_v1.sol";
import {Comptroller} from "../src/Comptroller.sol"; //@note
import {IComptroller} from "../src/Interfaces/CompoundV2/IComptroller.sol"; //@note
import {ICErc20} from "../src/Interfaces/CompoundV2/ICErc20.sol"; //@note
import {SimplePriceOracle} from  "../src/SimplePriceOracle.sol";
import {IOracle} from "../src/Interfaces/CompoundV2/IOracle.sol";
import {CToken} from "../src/CToken.sol";

contract LiquidBot_v1Test is Test {

    address owner1      = makeAddr("owner1");
    address owner2      = makeAddr("owner2");
    address offchain    = makeAddr("offchain");
    address validator   = makeAddr("validator");

    address morpho       = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    address dai          = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address wBTC         = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address usdt         = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address weth         = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address usdc         = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address comp         = 0xc00e94Cb662C3520282E6f5717214004A7f26888;

    address uniV3Router1 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address uniV3Router2 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

    address cwBTC        = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;
    address cUSDT        = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;
    address cUSDC        = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
    address cETH         = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
    address cLINK        = 0xFAce851a4921ce59e912d19329929CE6da6EB0c7;

    address public comptroller    = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B; //@note
    address public compAdmin      = 0x6d903f6003cca6255D85CcA4D3B5E5146dC33925; //@note
    address public victim         = 0x2565f8e0b33f2d3Bb1C0E2DD5fBb972dF48654c8; //@note
    address public realOracle     = 0x50ce56A3239671Ab62f185704Caedf626352741e; //@note
    SimplePriceOracle oracle;                                                   //@note

    CToken cDAI                  = CToken(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);
    CToken cCOMP                 = CToken(0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4);
    CToken cZRX                  = CToken(0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407);

    LiquidBot_v1 bot;
    ISwapRouter swapRouter = ISwapRouter(uniV3Router1);


    function setUp() public {

        vm.createSelectFork("ETH",19656465);
        bot             = new LiquidBot_v1(owner1,owner2,offchain,morpho,swapRouter);
        
        vm.startPrank(owner1);
        setApprove();
        vm.stopPrank();

        //@note
        // vm.startPrank(compAdmin);                      
        // oracle = new SimplePriceOracle();
        // IComptroller(comptroller)._setPriceOracle(address(oracle));

        // oracle.setUnderlyingPrice(CToken(cETH), IOracle(realOracle).getUnderlyingPrice(CToken(cETH))*10/11);
        // oracle.setUnderlyingPrice(CToken(cDAI), IOracle(realOracle).getUnderlyingPrice(CToken(cDAI)));
        // oracle.setUnderlyingPrice(CToken(cCOMP), IOracle(realOracle).getUnderlyingPrice(CToken(cCOMP)));
        // oracle.setUnderlyingPrice(CToken(cUSDT), IOracle(realOracle).getUnderlyingPrice(CToken(cUSDT)));
        // oracle.setUnderlyingPrice(CToken(cwBTC), IOracle(realOracle).getUnderlyingPrice(CToken(cwBTC)));
        // oracle.setUnderlyingPrice(CToken(cUSDC), IOracle(realOracle).getUnderlyingPrice(CToken(cUSDC)));
        // oracle.setUnderlyingPrice(CToken(cLINK), IOracle(realOracle).getUnderlyingPrice(CToken(cLINK)));
        //liquidity of victim: 689837593017604170

        vm.stopPrank();
    } 
 
    function testLiquidate() public {

        address[] memory _repayTokens       = new address[](1);
        _repayTokens[0] = usdc;
        address[] memory _cMarkets          = new address[](1);
        _cMarkets[0] = address(cUSDC);
        address[] memory _borrowers         = new address[](1);
        _borrowers[0] = victim;
        uint256[] memory _repayAmounts      = new uint256[](1);
        _repayAmounts[0] = 389561679; 
        address[] memory _cTokenCollaterals = new address[](1);
        _cTokenCollaterals[0] = address(cCOMP);
        
        vm.startPrank(offchain);
        (, uint liquidity, uint shortfall) = IComptroller(comptroller).getAccountLiquidity(victim);
        console.log("victim: Liquidity", liquidity);
        console.log("victim: Shortfall", shortfall);

        bytes[] memory path = new bytes[](1);
        path[0] = abi.encodePacked(address(comp), uint24(3000), address(weth), uint24(3000), usdc);
        bot.liquidate(_repayTokens,_cMarkets,_borrowers,_repayAmounts,_cTokenCollaterals,path);
        //console.log("DAI  balance:", IERC20(dai).balanceOf(address(bot)));
        console.log("owner1 balance:", IERC20(_repayTokens[0]).balanceOf(address(owner1)));
        console.log("owner2 balance:", IERC20(_repayTokens[0]).balanceOf(address(owner2)));
        console.log("Validator balance:", validator.balance);
    }


    function consoleMe() public {
        //emit log_named_decimal_uint("user2    wBTC balance:               ", wBTC.balanceOf(user2), wBTC.decimals());
    }

    //@audit get approve to all markets
    function setApprove() internal {
        address[] memory underTokens = new address[](17);
        underTokens[0] = 0x0D8775F648430679A709E98d2b0Cb6250d2887EF;
        underTokens[1] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        underTokens[2] = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        underTokens[3] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        underTokens[4] = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        underTokens[5] = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
        underTokens[6] = 0xE41d2489571d322189246DaFA5ebDe1F4699F498;
        underTokens[7] = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;
        underTokens[8] = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;
        underTokens[9] = 0xc00e94Cb662C3520282E6f5717214004A7f26888;
        underTokens[10] = 0x0000000000085d4780B73119b644AE5ecd22b376;
        underTokens[11] = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
        underTokens[12] = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2;
        underTokens[13] = 0x6B3595068778DD592e39A122f4f5a5cF09C90fE2;
        underTokens[14] = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
        underTokens[15] = 0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e;
        underTokens[16] = 0x8E870D67F660D95d5be530380D0eC0bd388289E1;


        address[] memory target1 = new address[](2);
        target1[0] = morpho;
        target1[1] = uniV3Router1;

        address[] memory target2 = new address[](17);
        target2[0] = 0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E;
        target2[1] = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;
        target2[2] = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
        target2[3] = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
        target2[4] = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;
        target2[6] = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;
        target2[7] = 0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407;
        target2[8] = 0xF5DCe57282A584D2746FaF1593d3121Fcac444dC;
        target2[9] = 0x35A18000230DA775CAc24873d00Ff85BccdeD550;
        target2[10] = 0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4;
        target2[11] = 0x12392F67bdf24faE0AF363c24aC620a2f67DAd86;  
        target2[12] = 0xFAce851a4921ce59e912d19329929CE6da6EB0c7;
        target2[13] = 0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b;
        target2[14] = 0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c;
        target2[15] = 0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946;
        target2[16] = 0x041171993284df560249B57358F931D9eB7b925D;




        bot.setvalidatorShare(100);
        bot.setApprove(underTokens,target1,type(uint256).max,false); //to morpho and router
        bot.setApprove(underTokens,target2,type(uint256).max,true); //to cMarket every

        
        // bot.setApprove(tokens,address(uniV3Router1),type(uint256).max);
        // bot.setApprove(tokens,address(uniV3Router2),type(uint256).max);
        // bot.setApprove(tokens,cETH,type(uint256).max);
        // bot.setApprove(tokens,cUSDC,type(uint256).max);
        // bot.setApprove(tokens,address(cDAI),type(uint256).max);
        
    }
}



// 0xE592427A0AEce92De3Edee1F18E0157C05861564
// [259960] SwapRouter::exactInput(ExactInputParams({ path: 0x6b175474e89094c44da98b954eedeac495271d0f000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, recipient: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, deadline: 1710151067 [1.71e9], amountIn: 100000000000000000000 [1e20], amountOutMinimum: 0 }))
// [7327]   SwapRouter::exactInput(ExactInputParams({ path: 0x6b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000000000000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, recipient: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb, deadline: 1710151067 [1.71e9], amountIn: 100000000000000000000 [1e20], amountOutMinimum: 0 }))