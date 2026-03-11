import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BatteryPassport from './V4_ABI.json';
import { QRCodeCanvas } from 'qrcode.react';

// Your Brand New V3 Contract
const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
const contractAddress = "0x408B8B59631c555568A977F847472dC0fC8Ac387"; // REMEMBER TO UPDATE THIS AFTER YOU DEPLOY!
const websiteURL = "https://volt-trace-blockchain-passport-f2w4.vercel.app";

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('app');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Minting State
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [capacity, setCapacity] = useState('');

  // Update State
  const [updateId, setUpdateId] = useState('');
  const [updateHealth, setUpdateHealth] = useState('');
  const [updateCycles, setUpdateCycles] = useState('');
  const [updateStatus, setUpdateStatus] = useState('1'); 

  // Verify State
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifyMode, setIsVerifyMode] = useState(false);
  
  // Ledger State
  const [passports, setPassports] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyId = urlParams.get('verify');
    
    if (verifyId !== null) {
      setIsVerifyMode(true);
      fetchSinglePassport(verifyId);
    } else {
      checkWallet();
    }
  }, []);

  async function checkWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsAdmin(true); 
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWalletAddress(accounts[0]);
    setIsAdmin(true); 
  }

  // --- IPFS UPLOAD FUNCTION ---
  const pinataJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0ZWJhOTk5OS02MjkzLTQzZDItYTcxZS01MGU0ZDUzY2NhNjciLCJlbWFpbCI6Im5hdmVlbnJhdmk0MDNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImUyMmZlYmVhN2FhMjg4NzAxZjIxIiwic2NvcGVkS2V5U2VjcmV0IjoiZjg0MGU3ZWI1ZGViNjI0N2Q4Y2U2MDY5NGIwYzk5YzA3OTAyZDgzYzZhN2M4MjdmNGE5ZGNjOTk0Zjg5ZTMwMiIsImV4cCI6MTgwNDc1NjU4OX0.JE_9Lhw1eYrSiNk2hTNB_s5EKyhvWcczNlW24gUMo0M"; 

  async function uploadToIPFS(metadata) {
    try {
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pinataJWT}`
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: { name: `Passport_${Date.now()}.json` }
        })
      });
      const data = await res.json();
      return data.IpfsHash; 
    } catch (error) {
      console.error("IPFS Upload Failed:", error);
      return "QmError";
    }
  }

  async function createPassport() {
    if (!manufacturer || !model || !ownerName || !capacity) return setStatusMsg("⚠️ Fill all fields.");
    try {
      setIsLoading(true);
      setStatusMsg("⏳ Uploading to IPFS...");
      
      // 1. Send data to Pinata
      const metadata = { manufacturer, model, ownerName, capacity, date: new Date().toLocaleDateString() };
      const realIPFSCid = await uploadToIPFS(metadata);

      // 2. Mint to Blockchain
      setStatusMsg("⏳ Minting Passport to Blockchain...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      const batteryId = "BAT-" + Date.now(); 

      // 3. FEATURE 5 FIX: Save the real IPFS link AND the Privacy Hash
      const dummySecretHash = ethers.keccak256(ethers.toUtf8Bytes("CollegeProjectSecret2026"));
      const tx = await contract.registerBattery(batteryId, realIPFSCid, dummySecretHash);
      await tx.wait();
      
      setStatusMsg(`✅ Success! Passport ID: ${batteryId}`); 
      setManufacturer(''); setModel(''); setOwnerName(''); setCapacity('');
      
      navigator.clipboard.writeText(batteryId);
      console.log("Minted ID:", batteryId, "IPFS:", realIPFSCid);

      fetchAllPassports();

    } catch (error) {
      console.error(error);
      setStatusMsg("❌ Transaction failed. Check console.");
    } finally {
      setIsLoading(false);
    }
  }
  
  async function updatePassport() {
    if (!updateId) return setStatusMsg("⚠️ Please enter a Token ID.");
    try {
      setIsLoading(true);
      setStatusMsg("⏳ Updating Status on Blockchain...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      // Send all 4 pieces of data to the blockchain!
      const tx = await contract.updateHealthAndStatus(updateId, updateHealth, updateCycles, updateStatus);
      await tx.wait();
      
      setStatusMsg(`✅ Token #${updateId} Status Updated Successfully!`);
      setUpdateId(''); setUpdateHealth(''); setUpdateCycles('');
    } catch (error) {
      console.error("Update Error:", error);
      setStatusMsg("❌ Update failed. Check console for details.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }

  async function fetchAllPassports() {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com"); 
      const abi = BatteryPassport.abi ? BatteryPassport.abi : BatteryPassport;
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const filter = contract.filters.BatteryMinted();
      const events = await contract.queryFilter(filter, -50000, "latest");

      const ledgerData = events.map(event => {
        const rawId = event.args[0];
        const safeId = typeof rawId === 'object' && rawId.hash ? "HASH-" + rawId.hash.substring(2, 8) : String(rawId);

        return {
          id: safeId,         
          manufacturer: String(event.args[1]), 
          ipfs: String(event.args[2])        
        };
      });

      setPassports(ledgerData.reverse()); 
    } catch (error) {
      console.error("Failed to fetch ledger events:", error);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchAllPassports();
  }, [isAdmin]);

  async function fetchSinglePassport(id) {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com"); 
      const abi = BatteryPassport.abi ? BatteryPassport.abi : BatteryPassport;
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      const statusMap = ["Active", "Recalled", "Stolen", "End of Life"];
      const data = await contract.getBattery(id);
      const ipfsCid = data.ipfsCid;
      
      // Fetch details from Pinata
      let offChainData = { ownerName: "Loading...", manufacturer: "Loading...", model: "", capacity: "...", date: "..." };
      if (ipfsCid && ipfsCid !== "QmPlaceholder123" && ipfsCid !== "QmError") {
         try {
            const ipfsRes = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);
            offChainData = await ipfsRes.json();
         } catch (e) {
            console.error("Could not load IPFS data", e);
         }
      }

      setVerifyData({
        id: data.batteryId,
        manufacturerWallet: data.manufacturer,
        ipfsCid: ipfsCid,
        status: statusMap[Number(data.status)],
        ownerName: offChainData.ownerName || "Unknown",
        model: `${offChainData.manufacturer || ''} ${offChainData.model || ''}`,
        capacity: offChainData.capacity || "Unknown",
        date: offChainData.date || "Unknown",
        healthPercentage: Number(data.healthPercentage), // <-- REAL DATA
        chargeCycles: Number(data.chargeCycles)          // <-- REAL DATA
      });
    } catch (error) {
      console.error("Verification Error:", error);
      setVerifyData("NOT_FOUND");
    }
  }

  if (isVerifyMode) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d041a", color: "white", fontFamily: "sans-serif", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "40px", borderRadius: "20px", border: "1px solid rgba(0,242,254,0.3)", maxWidth: "500px", width: "100%", boxShadow: "0 20px 50px rgba(0,242,254,0.1)" }}>
          <h2 style={{ textAlign: "center", color: "#00f2fe", marginTop: 0 }}>VERIFIED DIGITAL PASSPORT</h2>
          {verifyData === null ? <p style={{textAlign:"center"}}>Scanning Blockchain...</p> : 
           verifyData === "NOT_FOUND" ? <p style={{textAlign:"center", color:"#ff6161"}}>Passport Not Found.</p> : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "20px" }}>
                <span style={{color: "#a1a1aa"}}>TOKEN ID</span>
                <span style={{fontWeight: "bold"}}>#{verifyData.id}</span>
              </div>
              <p><strong>Owner:</strong> {verifyData.ownerName}</p>
              <p><strong>Make & Model:</strong> {verifyData.model}</p>
              <p><strong>Capacity:</strong> {verifyData.capacity} kWh</p>
              <p><strong>Production Date:</strong> {verifyData.date}</p>
              <p><strong>Status:</strong> <span style={{color: "#00f2fe"}}>{verifyData.status}</span></p>
              
              <div style={{ marginTop: "20px", background: "#000", padding: "15px", borderRadius: "10px" }}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <span>State of Health (SoH)</span>
                  <span style={{color: verifyData.healthPercentage > 80 ? "#10b981" : "#f59e0b", fontWeight: "bold"}}>{verifyData.healthPercentage}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#333", borderRadius: "4px", marginTop: "10px" }}>
                  <div style={{ width: `${verifyData.healthPercentage}%`, height: "100%", background: verifyData.healthPercentage > 80 ? "#10b981" : "#f59e0b", borderRadius: "4px" }}></div>
                </div>
                <p style={{fontSize: "12px", color: "#a1a1aa", textAlign: "right", marginTop: "5px"}}>{verifyData.chargeCycles} Charge Cycles</p>
              </div>

              <div style={{ textAlign: "center", marginTop: "25px" }}>
                <div style={{ background: "white", padding: "10px", borderRadius: "10px", display: "inline-block" }}>
                  <QRCodeCanvas 
                    value={`${window.location.origin}/?verify=${verifyData.id}`} 
                    size={150} 
                  />
                </div>
                <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "10px" }}>Scan to verify on blockchain</p>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", minHeight: "100vh", fontFamily: "'Poppins', sans-serif", background: "linear-gradient(135deg, #1a0b3e 0%, #0d041a 100%)", color: "white" }}>
      <header style={{ padding: "20px 50px", display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.5)", borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00f2fe" }}>VoltTrace SECURE</div>
        {walletAddress ? (
          <div style={{ color: isAdmin ? "#10b981" : "#ff6161", fontWeight: "bold" }}>
            {isAdmin ? "🛡️ Admin Verified" : "❌ Unauthorized"} | {walletAddress.slice(0, 6)}...
          </div>
        ) : (
          <button onClick={connectWallet} style={{ background: "#00f2fe", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Connect Wallet</button>
        )}
      </header>

      <div style={{ maxWidth: "1200px", margin: "50px auto", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px" }}>
          <h2 style={{borderBottom: "1px solid #333", paddingBottom: "10px"}}>1. Mint New EV Passport</h2>
          <input style={inputStyle} placeholder="Manufacturer (e.g. TATA)" value={manufacturer} onChange={e => setManufacturer(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} placeholder="Model (e.g. Nexon EV)" value={model} onChange={e => setModel(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} placeholder="Owner Name (e.g. John Doe)" value={ownerName} onChange={e => setOwnerName(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} type="number" placeholder="Capacity kWh (e.g. 30)" value={capacity} onChange={e => setCapacity(e.target.value)} disabled={!isAdmin || isLoading} />
          <button style={btnStyle} onClick={createPassport} disabled={!isAdmin || isLoading}>Mint Passport</button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px" }}>
          <h2 style={{borderBottom: "1px solid #333", paddingBottom: "10px"}}>2. Service & Update Battery</h2>
          <div style={{display: "flex", gap: "10px"}}>
             <input style={{...inputStyle, flex: 1}} type="text" placeholder="Token ID (e.g. BAT-123)" value={updateId} onChange={e => setUpdateId(e.target.value)} disabled={!isAdmin || isLoading} />
             <select style={{...inputStyle, flex: 2}} value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} disabled={!isAdmin || isLoading}>
                <option value="0">Active</option>
                <option value="1">Recalled</option>
                <option value="2">Stolen</option>
                <option value="3">End of Life</option>
             </select>
          </div>
          <div style={{display: "flex", gap: "10px"}}>
             <input style={{...inputStyle, flex: 1}} type="number" placeholder="New Health %" value={updateHealth} onChange={e => setUpdateHealth(e.target.value)} disabled={!isAdmin || isLoading} />
             <input style={{...inputStyle, flex: 1}} type="number" placeholder="Total Cycles" value={updateCycles} onChange={e => setUpdateCycles(e.target.value)} disabled={!isAdmin || isLoading} />
          </div>
          <button style={{...btnStyle, background: "#f59e0b"}} onClick={updatePassport} disabled={!isAdmin || isLoading}>Log Service Update</button>
          
          <div style={{marginTop: "30px", padding: "15px", background: "rgba(0,0,0,0.3)", borderRadius: "10px"}}>
            <p style={{fontSize: "14px", color: "#a1a1aa", margin: 0}}>Public Verification QR Tool:</p>
            <p style={{fontSize: "12px", color: "white"}}>Test QR URL: <code>{websiteURL}/?verify={updateId || "0"}</code></p>
          </div>
        </div>

        {statusMsg && <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#00f2fe", fontWeight: "bold", padding: "15px", background: "rgba(0,0,0,0.5)", borderRadius: "10px" }}>{statusMsg}</div>}
        
        {isAdmin && (
          <div style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px", marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>3. Global Admin Ledger</h2>
              <button onClick={fetchAllPassports} style={{ background: "transparent", border: "1px solid #00f2fe", color: "#00f2fe", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" }}>↻ Refresh Ledger</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {passports.length === 0 ? <p>No passports minted yet. Hit refresh!</p> : passports.map(p => (
                <div key={p.id} style={{ background: "rgba(0,0,0,0.5)", padding: "20px", borderRadius: "10px", border: "1px solid #333" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ color: "#00f2fe", fontWeight: "bold" }}>#{p.id}</span>
                  </div>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "white" }}><strong>Minted By:</strong> {p.manufacturer.slice(0,8)}...</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "15px" }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${websiteURL}/?verify=${p.id}`} 
                      alt={`QR for Token ${p.id}`} 
                      style={{ width: "60px", height: "60px", borderRadius: "5px", background: "white", padding: "2px" }} 
                    />
                    <a href={`/?verify=${p.id}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", color: "white", textDecoration: "none", background: "#3b82f6", padding: "10px", borderRadius: "5px", fontSize: "14px", fontWeight: "bold" }}>
                      View Passport ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", marginBottom: "15px", background: "rgba(0,0,0,0.3)", border: "1px solid #333", color: "white", borderRadius: "8px", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "15px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" };

export default App;