const hre = require("hardhat");

async function main() {
  const contractAddress = "0x3ecee88188a7fe0f5fd6666be09344523c947c1b";
  const myWalletAddress = "0x408bb859631c555568a977f847472dc0fc8ac387";

  const contract = await hre.ethers.getContractAt("BatteryPassport", contractAddress);

  // THE MAGIC FIX: Get the exact hash directly from the deployed contract!
  const EXACT_ROLE_HASH = await contract.MANUFACTURER_ROLE();
  console.log("Contract is demanding this exact hash:", EXACT_ROLE_HASH);

  console.log(`Granting role to: ${myWalletAddress}...`);
  const tx = await contract.grantRole(EXACT_ROLE_HASH, myWalletAddress);
  
  console.log("Transaction sent! Waiting for confirmation...");
  await tx.wait();

  console.log("Success! You now have the exact required role.");
} 

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});