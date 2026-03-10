// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BatteryPassport {
    // Role-Based Security
    address public admin;

    // Lifecycle Status Engine
    enum LifecycleStatus { Manufactured, Installed, EndOfLife, Recycled }

    // Advanced State of Health (SoH) Metrics
    struct Battery {
        uint256 id;
        string manufacturer;
        string model;
        string manufactureDate;
        uint256 capacityKWh;
        uint256 chargeCycles;
        uint256 healthPercentage;
        LifecycleStatus status;
    }

    mapping(uint256 => Battery) public batteries;
    uint256 public nextBatteryId;

    event PassportMinted(uint256 indexed id, string manufacturer, string model);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "SECURITY ALERT: Only the Admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender; 
    }

    function createPassport(
        string memory _manufacturer,
        string memory _model,
        string memory _date,
        uint256 _capacityKWh
    ) public onlyAdmin {
        batteries[nextBatteryId] = Battery({
            id: nextBatteryId,
            manufacturer: _manufacturer,
            model: _model,
            manufactureDate: _date,
            capacityKWh: _capacityKWh,
            chargeCycles: 0,
            healthPercentage: 100,
            status: LifecycleStatus.Manufactured
        });

        emit PassportMinted(nextBatteryId, _manufacturer, _model);
        nextBatteryId++;
    }
}