const hre = require("hardhat");

async function main() {
  // 1. Tell Hardhat which contract we want
  const contract = await hre.ethers.deployContract("BatteryPassport");

  // 2. Wait for it to be built on the network
  await contract.waitForDeployment();

  // 3. Print the permanent address
  console.log("🚀 Battery Passport deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});