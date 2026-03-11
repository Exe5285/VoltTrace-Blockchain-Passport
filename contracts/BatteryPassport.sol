// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract BatteryPassport is AccessControl {
    // Define Roles
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant SERVICE_CENTER_ROLE = keccak256("SERVICE_CENTER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Define Battery Statuses for the Revocation/Flagging System
    enum BatteryStatus { Active, Recalled, Stolen, EndOfLife }

    // Struct for Lifecycle Events (e.g., "Serviced", "Resold")
    struct LifecycleEvent {
        uint256 timestamp;
        string description;
        address recordedBy;
    }

    // Main Battery Struct
    struct Battery {
        string batteryId;     // The ID linked to your Dynamic QR Code
        address manufacturer; // Wallet address that minted it
        string ipfsCid;       // Link to the heavy metadata (health reports, etc.)
        BatteryStatus status; // Current status
        uint256 eventCount;   // Tracker for the events array
        uint8 healthPercentage; // <-- ADDED: State of Health (0-100%)
        uint16 chargeCycles;    // <-- ADDED: Number of charge cycles
    }

    // Mappings
    mapping(string => Battery) private batteries;
    mapping(string => mapping(uint256 => LifecycleEvent)) private batteryEvents;

    // Events for the Frontend to listen to
    event BatteryMinted(string batteryId, address indexed manufacturer, string ipfsCid);
    event StatusUpdated(string indexed batteryId, BatteryStatus newStatus);
    event EventLogged(string indexed batteryId, string description, address recordedBy);

    constructor() {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Core Functions ---

    // 1. Minting a new battery (Security unlocked for demo presentation)
    function registerBattery(string memory _batteryId, string memory _ipfsCid) public {
        require(bytes(batteries[_batteryId].batteryId).length == 0, "Battery already exists");
        
        batteries[_batteryId] = Battery({
            batteryId: _batteryId,
            manufacturer: msg.sender,
            ipfsCid: _ipfsCid,
            status: BatteryStatus.Active,
            eventCount: 0,
            healthPercentage: 100, // Default for new batteries
            chargeCycles: 0        // Default for new batteries
        });

        emit BatteryMinted(_batteryId, msg.sender, _ipfsCid);
    }

    // 2. Updating Health, Cycles, and Status (Security unlocked for demo presentation)
    function updateHealthAndStatus(string memory _batteryId, uint8 _newHealth, uint16 _newCycles, BatteryStatus _newStatus) public {
        require(bytes(batteries[_batteryId].batteryId).length != 0, "Battery does not exist");

        batteries[_batteryId].healthPercentage = _newHealth;
        batteries[_batteryId].chargeCycles = _newCycles;
        batteries[_batteryId].status = _newStatus;
        
        emit StatusUpdated(_batteryId, _newStatus);
    }

    // Add this so the website can read the data!
    function getBattery(string memory _batteryId) public view returns (Battery memory) {
        require(bytes(batteries[_batteryId].batteryId).length != 0, "Battery does not exist");
        return batteries[_batteryId];
    }
}