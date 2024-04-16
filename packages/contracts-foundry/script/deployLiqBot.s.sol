// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "../src/LiquidBot_v1.sol";
import {Script, console,console2} from "forge-std/Script.sol";
//forge script script/deployLiqBot.s.sol:DeployLiqBotScript --rpc-url $ETHER_RPC --broadcast
//0x1b57f4058863597071548a8b19fb2bd2b2ec3b6e
contract DeployLiqBotScript is Script {

    address owner1      = 0x1662De05D43C3a6512E0a6fDE48f074cd2384889;
    address owner2      = 0x7D665dBd0CB2ab8D9645d1Be78e5EafD8DAa1E97;
    address offchain    = 0x7014852D523d70Dd671cbcb1841Fbd6710906725;
    address morpho      = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    ISwapRouter swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564); //v1

    LiquidBot_v1 bot = LiquidBot_v1(payable(0x1b57f4058863597071548a8b19Fb2bd2B2EC3b6e));
    address botAddr = 0x1b57f4058863597071548a8b19Fb2bd2B2EC3b6e;

    address comp         = 0xc00e94Cb662C3520282E6f5717214004A7f26888;
    address weth         = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address usdc         = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    address cUSDC        = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
    address cCOMP        = 0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4;

    address victim       = 0x2565f8e0b33f2d3Bb1C0E2DD5fBb972dF48654c8;


    function setUp() public {



    }
//3878
    function run() public {
        //     bot = new LiquidBot_v1(
        //     owner1,
        //     owner2,
        //     offchain,
        //     morpho,
        //     swapRouter
        // );


        address[] memory underTokens = new address[](17);
        underTokens[0] = 0x0D8775F648430679A709E98d2b0Cb6250d2887EF; //bat
        underTokens[1] = 0x6B175474E89094C44Da98b954EedeAC495271d0F; //dai
        underTokens[2] = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; //weth
        underTokens[3] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; //usdc

        underTokens[4] = 0xdAC17F958D2ee523a2206206994597C13D831ec7; //usdt
        underTokens[5] = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599; //wBTC
        underTokens[6] = 0xE41d2489571d322189246DaFA5ebDe1F4699F498; //ZRX
        underTokens[7] = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359; //SAI

        underTokens[8] = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984; //UNI
        underTokens[9] = 0xc00e94Cb662C3520282E6f5717214004A7f26888; //COMP
        underTokens[10] = 0x0000000000085d4780B73119b644AE5ecd22b376; //TUSD
        underTokens[11] = 0x514910771AF9Ca656af840dff83E8264EcF986CA; //LINK

        underTokens[12] = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2; //MKR
        underTokens[13] = 0x6B3595068778DD592e39A122f4f5a5cF09C90fE2; //SUSHI
        underTokens[14] = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9; //AAVE
        underTokens[15] = 0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e; //YFI
        underTokens[16] = 0x8E870D67F660D95d5be530380D0eC0bd388289E1; //USDP

        address[] memory target1 = new address[](2);
        target1[0] = morpho;
        target1[1] = address(swapRouter);

        address[] memory target2 = new address[](17);
        target2[0] = 0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E;  //cBAT
        target2[1] = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;    //cDAI
        target2[2] = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;    //cETH
        target2[3] = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;    //cUSDC

        target2[4] = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;    //cUSDT
        target2[5] = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;    //cWBTC2
        target2[6] = 0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407;    //cZRX
        target2[7] = 0xF5DCe57282A584D2746FaF1593d3121Fcac444dC;    //cSAI

        target2[8] = 0x35A18000230DA775CAc24873d00Ff85BccdeD550;    //cUNI
        target2[9] = 0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4;    //cCOMP
        target2[10] = 0x12392F67bdf24faE0AF363c24aC620a2f67DAd86;   //cTUSD
        target2[11] = 0xFAce851a4921ce59e912d19329929CE6da6EB0c7;   //cLINK

        target2[12] = 0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b;   //cMKR
        target2[13] = 0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7;   //cSUSHI
        target2[14] = 0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c;   //cAAVE
        target2[15] = 0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946;   //cYFI
        target2[16] = 0x041171993284df560249B57358F931D9eB7b925D;   //cUSDP




        console.log(msg.sender);
        vm.broadcast(vm.envUint("DEPLOYER_KEY"));
        bot.setvalidatorShare(100);


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


        bytes[] memory path = new bytes[](1);
        path[0] = abi.encodePacked(address(comp), uint24(3000), address(weth), uint24(3000), usdc);

        vm.broadcast(vm.envUint("OFFCHAIN_KEY"));
        bot.liquidate(_repayTokens,_cMarkets,_borrowers,_repayAmounts,_cTokenCollaterals,path);


        //address(botAddr).call(abi.encodeWithSignature("setApprove(address[],address[],uint256,bool)",underTokens,target1,type(uint256).max,false));
        //address(botAddr).call(abi.encodeWithSignature("setApprove(address[],address[],uint256,bool)",underTokens,target2,type(uint256).max,true));




        // bot.setApprove(underTokens,target1,type(uint256).max,false); //to morpho and router
        // bot.setApprove(underTokens,target2,type(uint256).max,true); //to cMarket every







    }



}
