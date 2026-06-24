// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract InterChainRecords {
    event RecordStored(
        address indexed submitter,
        string  indexed recordType,
        string  cid,
        string  txHash,
        uint256 timestamp
    );

    struct Record {
        string  recordType;
        string  cid;
        string  txHash;
        uint256 timestamp;
        address submitter;
    }

    Record[] public records;

    function storeRecord(
        string calldata recordType,
        string calldata cid,
        string calldata txHash
    ) external {
        records.push(Record({
            recordType: recordType,
            cid:        cid,
            txHash:     txHash,
            timestamp:  block.timestamp,
            submitter:  msg.sender
        }));
        emit RecordStored(msg.sender, recordType, cid, txHash, block.timestamp);
    }

    function totalRecords() external view returns (uint256) {
        return records.length;
    }
}
