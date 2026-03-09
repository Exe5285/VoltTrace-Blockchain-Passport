require("@nomicfoundation/hardhat-toolbox");

// 🛑 WARNING: NEVER upload this file to GitHub with your real private key inside!
// Since this is a college project testnet, we are pasting it directly for simplicity.

const ALCHEMY_SEPOLIA_URL = "https://eth-sepolia.g.alchemy.com/v2/5e9G4IlGFLQOkmf6oml5v"; 
const PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE";
module.exports = {
  solidity: "0.8.28", // Make sure this matches the version in your BatteryPassport.sol file!
  networks: {
    sepolia: {
      url: ALCHEMY_SEPOLIA_URL,
      accounts: [PRIVATE_KEY]
    }
  }
};