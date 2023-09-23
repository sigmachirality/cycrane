// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import "../src/Router.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (Router router, address wallet) {
        vm.broadcast();
        router = new Router();
        wallet = router.createWallet("bagrimanasbir@gmail.com");
    }
}
