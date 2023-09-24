// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./BaseWallet.sol";



// acts as router + factory
contract Router {
    struct TxInfo {
        address to;
        uint256 value;
        bytes data;
        uint256 nonce;
    }

    mapping (bytes32 => address) public wallets;

    function call(
        string memory email, 
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        // msg len
        uint256[8] memory signals
    ) public returns (bytes memory) {
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        address wallet = createWalletIfNeccessary(emailHash);

        bytes memory returnData = BaseWallet(wallet).singleCall(a,b,c, signals);

        return returnData;
    }

    function createWallet(string memory email) external returns(address) {
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        require(wallets[emailHash] == address(0), "Wallet already exists");
        return createWalletIfNeccessary(emailHash);
    }

    function getWallet(string memory email) public view returns(address) {
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        return wallets[emailHash];
    }


    function createWalletIfNeccessary(bytes32 emailHash) internal returns(address) {
        address wallet = wallets[emailHash];
        if (wallet == address(0)) {
            bytes memory bytecode = type(BaseWallet).creationCode;
            address contractAddress;

            assembly {
                contractAddress := create2(0, add(bytecode, 32), mload(bytecode), emailHash)
            }

            wallets[emailHash] = contractAddress;

            wallet = contractAddress;
        }
        return wallet;
    }
}
