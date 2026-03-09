// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BatteryPassport is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // This defines what data a Passport holds
    struct Battery {
        string manufacturer;
        string model;
        string productionDate;
    }

    // A list that links every Passport ID to its Battery Data
    mapping(uint256 => Battery) public batteries;

    constructor() ERC721("EV Battery Passport", "EVB") Ownable(msg.sender) {}

    function createPassport(
        string memory tokenURI, 
        string memory manufacturer, 
        string memory model, 
        string memory productionDate
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Save the battery details to the blockchain
        batteries[tokenId] = Battery(manufacturer, model, productionDate);

        return tokenId;
    }
}