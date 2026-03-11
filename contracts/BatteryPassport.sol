// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract BatteryPassport is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant SERVICE_CENTER_ROLE = keccak256("SERVICE_CENTER_ROLE");

    enum BatteryStatus { Active, Recalled, Stolen, EndOfLife }

    struct Battery {
        string batteryId;
        address manufacturer;
        string ipfsCid;
        BatteryStatus status;
        uint8 healthPercentage;
        uint16 chargeCycles;
        bytes32 proprietaryDataHash; // FEATURE 5: Privacy Control Hash
    }

    mapping(string => Battery) private batteries;
    event BatteryMinted(string batteryId, address indexed manufacturer);
    event StatusUpdated(string indexed batteryId, BatteryStatus newStatus);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // FEATURE 1: RBAC (onlyRole added back)
    // FEATURE 5: Privacy Controls (accepts a secret hash)
    function registerBattery(string memory _batteryId, string memory _ipfsCid, bytes32 _secretHash) public onlyRole(MANUFACTURER_ROLE) {
        require(bytes(batteries[_batteryId].batteryId).length == 0, "Battery exists");
        
        batteries[_batteryId] = Battery({
            batteryId: _batteryId,
            manufacturer: msg.sender,
            ipfsCid: _ipfsCid,
            status: BatteryStatus.Active,
            healthPercentage: 100,
            chargeCycles: 0,
            proprietaryDataHash: _secretHash
        });

        emit BatteryMinted(_batteryId, msg.sender);
    }

    // FEATURE 1: RBAC (onlyRole added back)
    function updateHealthAndStatus(string memory _batteryId, uint8 _newHealth, uint16 _newCycles, BatteryStatus _newStatus) public onlyRole(SERVICE_CENTER_ROLE) {
        require(bytes(batteries[_batteryId].batteryId).length != 0, "Battery does not exist");
        batteries[_batteryId].healthPercentage = _newHealth;
        batteries[_batteryId].chargeCycles = _newCycles;
        batteries[_batteryId].status = _newStatus;
        emit StatusUpdated(_batteryId, _newStatus);
    }

    // FEATURE 5: Privacy Verification (Proves data without revealing it)
    function verifyPrivateData(string memory _batteryId, string memory _clearTextSecret) public view returns (bool) {
        return batteries[_batteryId].proprietaryDataHash == keccak256(abi.encodePacked(_clearTextSecret));
    }

    function getBattery(string memory _batteryId) public view returns (Battery memory) {
        require(bytes(batteries[_batteryId].batteryId).length != 0, "Battery does not exist");
        return batteries[_batteryId];
    }
}