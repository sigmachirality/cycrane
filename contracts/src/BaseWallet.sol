// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Router.sol";

contract BaseWallet {

    uint256 public nonce;
    address public verifier;
    event Success(bytes returnData);


    function initialize(address _verifier) public {
        verifier = _verifier;
    }

    function singleCall(
        Router.TxInfo memory info,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        // msg len
        uint256[8] memory signals
    ) public returns(bytes memory) {
        require(_prove(a,b,c,signals), "invalid_proof");
        
        bytes memory returnValue = _singleCall(info);

        emit Success(returnValue);

        return returnValue;
    }



    function _getInfo(uint256[8] memory signals) internal pure returns (Router.TxInfo memory) {
        Router.TxInfo memory info;

        // TODO!
        
        // write shit

        return info;
    }

    function _prove(        
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        // msg len
        uint256[8] memory signals
    ) internal pure returns(bool) {
        // write proof

        // TODO!
        return true;
    }

    function _singleCall(Router.TxInfo memory info) internal returns(bytes memory) {
        require(info.nonce == nonce, "Nonce mismatch");
        (bool success, bytes memory data) = payable(info.to).call{value: info.value}(info.data);
        // increment nonce no matter what
        unchecked {
            ++nonce;
        }
        require(success, "Tx failed");
        
        return data;
    }

    /* 
        function _multiCall(Router.TxInfo[] memory info) internal returns(bytes[] memory) {
            bytes[] memory returnBytes = new bytes[](info.length);
            uint i = 0;
            Router.TxInfo memory tx_info;
            while (i < info.length) {
                tx_info = info[i];
                require(tx_info.nonce == nonce, "Nonce mismatch");
                (bool success, bytes memory data) = payable(tx_info.to).call{value: tx_info.value}(tx_info.data);
                require(success, "Tx failed");
                bytes memory newData = data;
                returnBytes[i] = (newData);
                unchecked {
                    ++i;
                    ++nonce;
                }
            }
            return returnBytes;
        }

        function multiCall(
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c,
            // msg len
            uint256[8] memory signals
        ) public returns(bytes[] memory) {
            require(_prove(a,b,c,signals), "invalid_proof");
            Router.TxInfo[] memory info = _getInfo(signals);
            
            bytes[] memory returnValue = _multiCall(info);

            emit Success(returnValue);

            return returnValue;
        } 
    */
}
