// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import {Script} from "forge-std/Script.sol";

// import {console2 as console} from "forge-std/console2.sol";
// import {stdJson} from "forge-std/StdJson.sol";

// import {Deployer} from "./Deployer.sol";
// import {DeployConfig} from "./DeployConfig.s.sol";

// import {
//     TransparentUpgradeableProxy,
//     ITransparentUpgradeableProxy
// } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// import {Bridge} from "src/Bridge.sol";
// import {ZkBridgeAdmin} from "src/ZkBridgeAdmin.sol";
// import "src/interfaces/IZKBridgeEndpoint.sol";
// import "src/interfaces/IL1Bridge.sol";

// // forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.linea.build --private-key $ZK_PRIVATE_KEY --broadcast
// // forge script script/Deploy.s.sol:DeployScript --rpc-url https://mainnet.base.org --private-key $ZK_PRIVATE_KEY --with-gas-price 100000050 --broadcast
// // forge script script/Deploy.s.sol:DeployScript --rpc-url https://arb1.arbitrum.io/rpc --private-key $ZK_PRIVATE_KEY --with-gas-price 100000000 --broadcast
// // forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.mantle.xyz --private-key $ZK_PRIVATE_KEY --broadcast --slow

// contract DeployScript is Deployer {
//     using SafeERC20 for IERC20;

//     DeployConfig cfg;

//     function setUp() public override {
//         super.setUp();

//         string memory path = string.concat(vm.projectRoot(), "/deploy-config/", deploymentContext, ".json");
//         cfg = new DeployConfig(path);

//         console.log("Deploying from %s", deployScript);
//         console.log("Deployment context: %s", deploymentContext);
//     }

//     function run() public {
//         console.log("Deploying");
//         deployProxyAdmin();
//         deployBridge();
//         setBridgeLookup();
//         setPools();
//     }

//     // forge script script/Deploy.s.sol:DeployScript --sig "setAll()" --rpc-url https://rpc.linea.build --private-key $ZK_PRIVATE_KEY --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "setAll()" --rpc-url https://mainnet.base.org --private-key $ZK_PRIVATE_KEY --with-gas-price 100000050 --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "setAll()" --rpc-url https://arb1.arbitrum.io/rpc --private-key $ZK_PRIVATE_KEY --with-gas-price 100000000 --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "setAll()" --rpc-url https://rpc.mantle.xyz --private-key $ZK_PRIVATE_KEY --broadcast --slow
//     function setAll() public {
//         setBridgeLookup();
//         setPools();
//     }

//     /// @notice Deploy the ProxyAdmin
//     function deployProxyAdmin() public returns (address addr_) {
//         ZkBridgeAdmin admin;
//         if (cfg.proxyAdmin() == address(0)) {
//             vm.broadcast();
//             admin = new ZkBridgeAdmin();
//         } else {
//             admin = ZkBridgeAdmin(cfg.proxyAdmin());
//         }
//         require(admin.owner() == msg.sender);

//         save("ProxyAdmin", address(admin));
//         console.log("ProxyAdmin deployed at %s", address(admin));
//         addr_ = address(admin);
//     }

//     function deployBridge() public returns (address addr_) {
//         address proxyAdmin = mustGetAddress("ProxyAdmin");

//         address zkEndpoint = cfg.zkEndpoint();
//         address l1Bridge = cfg.isL1() ? cfg.l1Bridge() : address(0);
//         uint256 nativeTokenPoolId = cfg.nativeTokenPoolId();
//         vm.broadcast();
//         Bridge bridge = new Bridge(IZKBridgeEndpoint(zkEndpoint), IL1Bridge(l1Bridge), nativeTokenPoolId);

//         save("Bridge", address(bridge));
//         console.log("Bridge deployed at %s", address(bridge));

//         bytes memory payload = abi.encodeWithSignature("initialize()");
//         vm.broadcast();
//         TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
//             address(bridge),
//             proxyAdmin,
//             payload
//         );
//         Bridge _bridge = Bridge(payable(address(proxy)));

//         address admin = address(uint160(uint256(vm.load(address(proxy), OWNER_KEY))));
//         require(admin == proxyAdmin);
//         require(_bridge.poolManager() == msg.sender);
//         require(_bridge.bridgeManager() == msg.sender);
//         require(_bridge.bridgeReviewer() == msg.sender);
//         require(address(_bridge.zkBridgeEndpoint()) == cfg.zkEndpoint());
//         require(address(_bridge.l1Bridge()) == (cfg.isL1() ? cfg.l1Bridge() : address(0)));
//         require(_bridge.NATIVE_TOKEN_POOL_ID() == cfg.nativeTokenPoolId());

//         save("BridgeProxy", address(proxy));
//         console.log("BridgeProxy deployed at %s", address(proxy));
//         addr_ = address(proxy);
//     }

//     function setBridgeLookup() public {
//         address payable bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);

//         for (uint256 i = 0; i < cfg.receiveChainsLength(); i++) {
//             DeployConfig.ReceiveChainInfo memory receiveChain = cfg.getReceiveChains(i);
//             uint16 _dstChainId = receiveChain.chainId;
//             require(_dstChainId > 0, "dstChainId invalid");
//             if (isZeroAddress(receiveChain.bridge)) {
//                 continue;
//             }

//             if (bridge.bridgeLookup(_dstChainId) != receiveChain.bridge) {
//                 vm.broadcast();
//                 bridge.setBridge(_dstChainId, receiveChain.bridge);

//                 console.log("setBridge dstChain: %s, bridge:%s", _dstChainId, receiveChain.bridge);
//             }
//             require(bridge.bridgeLookup(_dstChainId) == receiveChain.bridge);
//         }
//     }

//     function setPools() public {
//         address bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);
//         require(bridge.NATIVE_TOKEN_POOL_ID() == cfg.nativeTokenPoolId());

//         for (uint256 i = 0; i < cfg.allPoolLength(); i++) {
//             DeployConfig.PoolInfo memory pool = cfg.getPoolInfo(i);
//             uint256 poolId = pool.id;
//             require(poolId > 0, "poolId invalid");
//             require(pool.localDecimals >= pool.sharedDecimals, "localDecimals < sharedDecimals");
//             if (poolId != cfg.nativeTokenPoolId()) {
//                 require(ERC20(pool.token).decimals() == pool.localDecimals, "decimals invalid");
//                 require(
//                     keccak256(abi.encode(ERC20(pool.token).symbol())) == keccak256(abi.encode(pool.token_symbol)),
//                     "symbol invalid"
//                 );
//             }

//             if (!bridge.poolInfo(poolId).enabled) {
//                 vm.broadcast();
//                 bridge.createPool(poolId, pool.token, pool.localDecimals - pool.sharedDecimals);
//                 console.log("createPool poolId: %s, token:%s", poolId, pool.token);
//             } else {
//                 console.log("Pool already exists");
//             }
//             require(bridge.poolInfo(poolId).enabled);
//             require(bridge.poolInfo(poolId).token == pool.token);
//             require(bridge.poolInfo(poolId).convertRateDecimals == pool.localDecimals - pool.sharedDecimals);

//             // set maxLiquidity
//             uint256 maxLiquidity = pool.maxLiquidity == 0 ? type(uint256).max : pool.maxLiquidity;
//             if (bridge.poolInfo(poolId).maxLiquidity != maxLiquidity) {
//                 vm.broadcast();
//                 bridge.setMaxLiquidity(poolId, maxLiquidity);
//                 console.log("setMaxLiquidity poolId: %s, maxLiquidity:%s", poolId, pool.maxLiquidity);
//             } else {
//                 console.log("maxLiquidity already set");
//             }
//             require(bridge.poolInfo(poolId).maxLiquidity == maxLiquidity);

//             for (uint256 j = 0; j < pool.dstChains.length; j++) {
//                 DeployConfig.DstChainInfo memory dstChain = pool.dstChains[j];
//                 uint16 _dstChainId = dstChain.id;
//                 require(_dstChainId > 0, "dstChainId invalid");

//                 // enable dst chain
//                 if (!bridge.dstChains(poolId, _dstChainId).enabled) {
//                     vm.broadcast();
//                     bridge.setDstChain(poolId, _dstChainId, true);
//                     console.log("setDstChain poolId: %s, dstChainId:%s", poolId, _dstChainId);
//                 } else {
//                     console.log("DstChain already enabled");
//                 }
//                 require(bridge.dstChains(poolId, _dstChainId).enabled);

//                 // setMaxTransferLimit
//                 uint256 maxTransferLimit =
//                     dstChain.maxTransferLimit == 0 ? type(uint256).max : dstChain.maxTransferLimit;
//                 if (bridge.dstChains(poolId, _dstChainId).maxTransferLimit != maxTransferLimit) {
//                     vm.broadcast();
//                     bridge.setMaxTransferLimit(poolId, _dstChainId, maxTransferLimit);
//                     console.log(
//                         "setMaxTransferLimit poolId: %s, dstChainId:%s, maxTransferLimit:%s",
//                         poolId,
//                         _dstChainId,
//                         maxTransferLimit
//                     );
//                 } else {
//                     console.log("maxTransferLimit already set");
//                 }
//                 require(bridge.dstChains(poolId, _dstChainId).maxTransferLimit == maxTransferLimit);

//                 // setStaticFee
//                 if (bridge.dstChains(poolId, _dstChainId).staticFee != dstChain.staticFee) {
//                     vm.broadcast();
//                     bridge.setStaticFee(poolId, _dstChainId, dstChain.staticFee);
//                     console.log(
//                         "setStaticFee poolId: %s, dstChainId:%s, staticFee:%s", poolId, _dstChainId, dstChain.staticFee
//                     );
//                 } else {
//                     console.log("staticFee already set");
//                 }
//                 require(bridge.dstChains(poolId, _dstChainId).staticFee == dstChain.staticFee);
//             }
//         }
//     }

//     //----------------------------------------Add Liquidity---------------------------------------------------

//     // forge script script/Deploy.s.sol:DeployScript --sig "addLiquidityETH(uint256)" amount --rpc-url https://rpc.linea.build --private-key $ZK_PRIVATE_KEY --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "addLiquidityETH(uint256)" amount --rpc-url https://mainnet.base.org --private-key $ZK_PRIVATE_KEY --with-gas-price 100000050 --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "addLiquidityETH(uint256)" amount --rpc-url https://arb1.arbitrum.io/rpc --private-key $ZK_PRIVATE_KEY --with-gas-price 100000000 --broadcast
//     function addLiquidityETH(uint256 amount_) public {
//         address bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);
//         uint256 balance = bridge.poolInfo(cfg.nativeTokenPoolId()).balance;

//         vm.broadcast();
//         bridge.addLiquidityETH{value: amount_}();
//         console.log("addLiquidityETH amount: %s", amount_);

//         require(bridge.poolInfo(cfg.nativeTokenPoolId()).balance >= balance + amount_);
//     }

//     // forge script script/Deploy.s.sol:DeployScript --sig "addLiquidity(uint256,uint256)" poolId amount --rpc-url https://rpc.mantle.xyz --private-key $ZK_PRIVATE_KEY --broadcast --slow
//     function addLiquidity(uint256 poolId_, uint256 amount_) public {
//         address bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);
//         uint256 balance = bridge.poolInfo(poolId_).balance;

//         IERC20 token = IERC20(bridge.poolInfo(poolId_).token);

//         vm.broadcast();
//         token.approve(address(bridge), amount_);

//         vm.broadcast();
//         bridge.addLiquidity(poolId_, amount_);
//         console.log("addLiquidity amount: %s", amount_);

//         require(bridge.poolInfo(poolId_).balance >= balance + amount_);
//     }

//     // forge script script/Deploy.s.sol:DeployScript --sig "transferETH(uint16,uint256)" dstChainId amount --rpc-url https://rpc.linea.build --private-key $ZK_PRIVATE_KEY --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "transferETH(uint16,uint256)" dstChainId amount --rpc-url https://mainnet.base.org --private-key $ZK_PRIVATE_KEY --with-gas-price 100000050 --broadcast
//     // forge script script/Deploy.s.sol:DeployScript --sig "transferETH(uint16,uint256)" dstChainId amount --rpc-url https://arb1.arbitrum.io/rpc --private-key $ZK_PRIVATE_KEY --with-gas-price 100000000 --broadcast
//     function transferETH(uint16 dstChainId_, uint256 amount_) public {
//         address bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);
//         uint256 balance = bridge.poolInfo(cfg.nativeTokenPoolId()).balance;

//         uint256 fee = bridge.estimateFee(cfg.nativeTokenPoolId(), dstChainId_);

//         vm.broadcast();
//         bridge.transferETH{value: amount_ + fee}(dstChainId_, amount_, msg.sender);
//         console.log("transferETH amount: %s, fee: %s", amount_, fee);

//         require(bridge.poolInfo(cfg.nativeTokenPoolId()).balance - balance == amount_);
//     }

//     // forge script script/Deploy.s.sol:DeployScript --sig "transferToken(uint16,uint256,uint256)" dstChainId poolId amount --rpc-url https://rpc.mantle.xyz --private-key $ZK_PRIVATE_KEY --broadcast --slow
//     function transferToken(uint16 dstChainId_, uint256 poolId_, uint256 amount_) public {
//         address bridgeProxy = mustGetAddress("BridgeProxy");
//         Bridge bridge = Bridge(bridgeProxy);
//         uint256 balance = bridge.poolInfo(poolId_).balance;

//         uint256 fee = bridge.estimateFee(poolId_, dstChainId_);

//         IERC20 token = IERC20(bridge.poolInfo(poolId_).token);

//         vm.broadcast();
//         token.approve(address(bridge), amount_);

//         vm.broadcast();
//         bridge.transferToken{value: fee}(dstChainId_, poolId_, amount_, msg.sender);
//         console.log("transferToken amount: %s, fee: %s", amount_, fee);

//         require(bridge.poolInfo(poolId_).balance - balance == amount_);
//     }
// }
