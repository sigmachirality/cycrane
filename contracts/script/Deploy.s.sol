// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import "../src/Router.sol";
import "../src/Verifier.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (Router router, address wallet, Groth16Verifier verifier) {
        vm.broadcast();
        verifier = new Groth16Verifier();
        router = new Router(address(verifier));
        wallet = router.createWallet("bagrimanasbir@gmail.com");
    }
}
