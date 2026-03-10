// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BatteryPassport {
    // Multi-Admin Role-Based Security
    mapping(address => bool) public admins;

    // Lifecycle Status Engine
    enum LifecycleStatus { Manufactured, Installed, EndOfLife, Recycled }

    // Advanced Metrics with Owner Tracking
    struct Battery {
        uint256 id;
        string manufacturer;
        string model;
        string ownerName; // NEW: Track who owns the EV!
        string manufactureDate;
        uint256 capacityKWh;
        uint256 chargeCycles;
        uint256 healthPercentage;
        LifecycleStatus status;
    }

    mapping(uint256 => Battery) public batteries;
    uint256 public nextBatteryId;

    event PassportMinted(uint256 indexed id, string manufacturer, string model);
    event AdminAdded(address indexed newAdmin);
    event StatusUpdated(uint256 indexed id, LifecycleStatus newStatus);
    event HealthUpdated(uint256 indexed id, uint256 health, uint256 cycles);
    
    // Security check: Is this wallet in the Admin list?
    modifier onlyAdmin() {
        require(admins[msg.sender] == true, "SECURITY ALERT: Unassigned wallet. Only authorized Admins can perform this action");
        _;
    }

    constructor() {
        admins[msg.sender] = true; // The wallet that deploys this becomes the Master Admin
    }

    // Feature: Master Admin can authorize showrooms to mint/update passports
    function addShowroomAdmin(address _newAdmin) public onlyAdmin {
        admins[_newAdmin] = true;
        emit AdminAdded(_newAdmin);
    }

    function createPassport(
        string memory _manufacturer,
        string memory _model,
        string memory _ownerName,
        string memory _date,
        uint256 _capacityKWh
    ) public onlyAdmin {
        batteries[nextBatteryId] = Battery({
            id: nextBatteryId,
            manufacturer: _manufacturer,
            model: _model,
            ownerName: _ownerName,
            manufactureDate: _date,
            capacityKWh: _capacityKWh,
            chargeCycles: 0,
            healthPercentage: 100,
            status: LifecycleStatus.Manufactured
        });

        emit PassportMinted(nextBatteryId, _manufacturer, _model);
        nextBatteryId++;
    }

    // Feature: Showrooms can update health, cycles, and status when serviced
    function updateHealthAndStatus(uint256 _id, uint256 _health, uint256 _cycles, LifecycleStatus _status) public onlyAdmin {
        require(_id < nextBatteryId, "Battery does not exist");
        require(_health <= 100, "Health cannot mathematically exceed 100%");
        
        batteries[_id].healthPercentage = _health;
        batteries[_id].chargeCycles = _cycles;
        batteries[_id].status = _status;

        emit HealthUpdated(_id, _health, _cycles);
        emit StatusUpdated(_id, _status);
    }
}