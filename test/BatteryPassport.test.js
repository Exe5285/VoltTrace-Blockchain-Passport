const { expect } = require("chai");
const hre = require("hardhat");

describe("Battery Passport System", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("BatteryPassport");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("Should save battery details correctly", async function () {
    const tokenURI = "https://example.com/battery/1";
    const manufacturer = "Tesla";
    const model = "Model S Long Range";
    const date = "2024-02-10"; // Today's date

    // Create the passport with details
    const tx = await contract.createPassport(tokenURI, manufacturer, model, date);
    await tx.wait();

    // Fetch the details back from the blockchain to verify
    const batteryData = await contract.batteries(0);

    console.log("✅ Manufacturer Saved:", batteryData.manufacturer);
    console.log("✅ Model Saved:", batteryData.model);

    expect(batteryData.manufacturer).to.equal("Tesla");
    expect(batteryData.model).to.equal("Model S Long Range");
  });
});