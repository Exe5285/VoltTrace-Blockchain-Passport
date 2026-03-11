const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Passport = await hre.ethers.getContractFactory("BatteryPassport");
  const passport = await Passport.deploy();
  await passport.waitForDeployment();

  const address = await passport.getAddress();
  console.log("✅ Battery Passport deployed to:", address);

  // Granting you ALL Roles so your demo doesn't fail!
  const MANUF_ROLE = await passport.MANUFACTURER_ROLE();
  const SERV_ROLE = await passport.SERVICE_CENTER_ROLE();
  
  await passport.grantRole(MANUF_ROLE, deployer.address);
  await passport.grantRole(SERV_ROLE, deployer.address);
  
  console.log("🔐 RBAC Complete: You have been granted Manufacturer and Service Center roles.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});