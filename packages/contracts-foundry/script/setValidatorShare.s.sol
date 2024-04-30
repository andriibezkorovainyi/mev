import {Script, console} from "forge-std/Script.sol";
import {LiquidBot_v1} from "../src/LiquidBot_v1.sol";

contract SetValidatorShare is Script {
    LiquidBot_v1 bot = LiquidBot_v1(payable(0x1b57f4058863597071548a8b19Fb2bd2B2EC3b6e));

    function setUp() public {}

    function run() public {
        vm.broadcast(vm.envUint("MY_OWNER"));
        bot.setvalidatorShare(9500);
    }
}