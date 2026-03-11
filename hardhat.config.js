require("@nomicfoundation/hardhat-toolbox");

// 🛑 WARNING: NEVER upload this file to GitHub with your real private key inside!
// Since this is a college project testnet, we are pasting it directly for simplicity.

const ALCHEMY_SEPOLIA_URL = "https://eth-sepolia.g.alchemy.com/v2/5e9G4IlGFLQOkmf6oml5v"; 
const PRIVATE_KEY = "db5987a07ec3f1251e943ec18f9e818d32c78bf399e509ce8bc4c91a476969bb"
module.exports = {
  solidity: "0.8.28", // Make sure this matches the version in your BatteryPassport.sol file!
  networks: {
    sepolia: {
      url: ALCHEMY_SEPOLIA_URL,
      accounts: [PRIVATE_KEY]
    }
  }
};