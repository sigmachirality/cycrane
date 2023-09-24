// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Router.sol";

contract BaseWallet {

    uint256 public nonce;

    event Success(bytes[] returnData);

    function multiCall(Router.TxInfo[] memory info, bytes memory proof) public returns(bytes[] memory) {
        require(_prove(info, proof), "invalid_proof");
        _multiCall(info);
        bytes[] memory returnValue = returnBytes;
        returnBytes = new bytes[](0);

        emit Success(returnValue);

        return returnValue;
    }

    function _prove(Router.TxInfo[] memory info, bytes memory proof) public returns(bool) {
        // write proof


        return true;
    }


    bytes[] returnBytes;


    function _multiCall(Router.TxInfo[] memory info) internal returns(bytes[] memory) {
        uint i = 0;
        Router.TxInfo memory tx_info;
        while (i < info.length) {
            tx_info = info[i];
            require(tx_info.nonce == nonce, "Nonce mismatch");
            (bool success, bytes memory data) = payable(tx_info.to).call{value: tx_info.value}(tx_info.data);
            require(success, "Tx failed");
            bytes memory newData = data;
            returnBytes.push(newData);
            unchecked {
                ++i;
                ++nonce;
            }
        }
        return returnBytes;
    }

}
