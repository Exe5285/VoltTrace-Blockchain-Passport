import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BatteryPassport from './V4_ABI.json';

// Your Brand New V3 Contract
const contractAddress = "0xbEbEBdbf0aEd00b918692A59A4B7337C0382E59D"; 
// Change this to your Vercel link later!
const websiteURL = "https://volt-trace-blockchain-passport.vercel.app"; 

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
  const [updateStatus, setUpdateStatus] = useState('1'); // Default to Installed

  // Verify State
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifyMode, setIsVerifyMode] = useState(false);
  // Ledger State
  const [passports, setPassports] = useState([]);

  useEffect(() => {
    // Check if URL has ?verify=ID
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
        checkIfAdmin(accounts[0]);
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWalletAddress(accounts[0]);
    checkIfAdmin(accounts[0]);
  }

  async function checkIfAdmin(address) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, provider);
    try {
      const adminStatus = await contract.admins(address);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Admin check failed", error);
    }
  }

  async function createPassport() {
    if (!manufacturer || !model || !ownerName || !capacity) return setStatusMsg("⚠️ Fill all fields.");
    try {
      setIsLoading(true);
      setStatusMsg("⏳ Minting Passport...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      const today = new Date().toISOString().split('T')[0];
      const tx = await contract.createPassport(manufacturer, model, ownerName, today, capacity);
      await tx.wait();
      
      setStatusMsg("✅ Passport Minted Successfully!");
      setManufacturer(''); setModel(''); setOwnerName(''); setCapacity('');
    } catch (error) {
      setStatusMsg("❌ Transaction failed.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }

  async function updatePassport() {
    if (!updateId || !updateHealth || !updateCycles) return setStatusMsg("⚠️ Fill all update fields.");
    try {
      setIsLoading(true);
      setStatusMsg("⏳ Updating Ledger...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      const tx = await contract.updateHealthAndStatus(updateId, updateHealth, updateCycles, updateStatus);
      await tx.wait();
      
      setStatusMsg(`✅ Token #${updateId} Updated Successfully!`);
      setUpdateId(''); setUpdateHealth(''); setUpdateCycles('');
    } catch (error) {
      setStatusMsg("❌ Update failed. Check ID.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }
  async function fetchAllPassports() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, provider);
      const totalPassports = await contract.nextBatteryId();
      const statusMap = ["Manufactured", "Installed in EV", "End of Life", "Recycled"];
      
      let tempLedger = [];
      for (let i = 0; i < Number(totalPassports); i++) {
        const data = await contract.batteries(i);
        tempLedger.push({
          id: Number(data[0]),
          manufacturer: data[1],
          model: data[2],
          ownerName: data[3],
          healthPercentage: Number(data[7]),
          status: statusMap[Number(data[8])]
        });
      }
      setPassports(tempLedger.reverse()); // Show newest first
    } catch (error) {
      console.error("Failed to fetch ledger", error);
    }
  }

  // Auto-fetch the ledger when the admin connects
  useEffect(() => {
    if (isAdmin) fetchAllPassports();
  }, [isAdmin]);
// Public Verifier Function (Forced Alchemy Node)
  async function fetchSinglePassport(id) {
    try {
      // 1. FORCE the app to use Alchemy so mobile browsers (like Brave) don't interfere!
      // MAKE SURE YOUR ALCHEMY HTTPS URL IS PASTED IN THE QUOTES BELOW:
      const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/5e9G4IlGFLQOkmf6oml5v"); 
      
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, provider);
      const statusMap = ["Manufactured", "Installed in EV", "End of Life", "Recycled"];

      // 2. Fetch the data
      const data = await contract.batteries(id);
      
      if (data[1] === "") {
         setVerifyData("NOT_FOUND");
         return;
      }
      
      // 3. Set the UI
      setVerifyData({
        id: Number(data[0]),
        manufacturer: data[1],
        model: data[2],
        ownerName: data[3],
        date: data[4],
        capacity: Number(data[5]),
        chargeCycles: Number(data[6]),
        healthPercentage: Number(data[7]),
        status: statusMap[Number(data[8])]
      });
    } catch (error) {
      console.error("Verification Error:", error);
      setVerifyData("NOT_FOUND");
    }
  }
  // === RENDER PUBLIC VERIFIER ===
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
              <p><strong>Make & Model:</strong> {verifyData.manufacturer} {verifyData.model}</p>
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
            </div>
          )}
        </div>
      </div>
    );
  }

  // === RENDER SECURE ADMIN DASHBOARD ===
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
        
        {/* PANEL 1: MINTING */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px" }}>
          <h2 style={{borderBottom: "1px solid #333", paddingBottom: "10px"}}>1. Mint New EV Passport</h2>
          <input style={inputStyle} placeholder="Manufacturer (e.g. TATA)" value={manufacturer} onChange={e => setManufacturer(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} placeholder="Model (e.g. Nexon EV)" value={model} onChange={e => setModel(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} placeholder="Owner Name (e.g. John Doe)" value={ownerName} onChange={e => setOwnerName(e.target.value)} disabled={!isAdmin || isLoading} />
          <input style={inputStyle} type="number" placeholder="Capacity kWh (e.g. 30)" value={capacity} onChange={e => setCapacity(e.target.value)} disabled={!isAdmin || isLoading} />
          <button style={btnStyle} onClick={createPassport} disabled={!isAdmin || isLoading}>Mint Passport</button>
        </div>

        {/* PANEL 2: UPDATING & SERVICE */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px" }}>
          <h2 style={{borderBottom: "1px solid #333", paddingBottom: "10px"}}>2. Service & Update Battery</h2>
          <div style={{display: "flex", gap: "10px"}}>
             <input style={{...inputStyle, flex: 1}} type="number" placeholder="Token ID (e.g. 0)" value={updateId} onChange={e => setUpdateId(e.target.value)} disabled={!isAdmin || isLoading} />
             <select style={{...inputStyle, flex: 2}} value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} disabled={!isAdmin || isLoading}>
                <option value="0">Manufactured</option>
                <option value="1">Installed in EV</option>
                <option value="2">End of Life</option>
                <option value="3">Recycled</option>
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
        {/* PANEL 3: GLOBAL ADMIN LEDGER */}
        {isAdmin && (
          <div style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "20px", marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>3. Global Admin Ledger</h2>
              <button onClick={fetchAllPassports} style={{ background: "transparent", border: "1px solid #00f2fe", color: "#00f2fe", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" }}>↻ Refresh Ledger</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {passports.length === 0 ? <p>No passports minted yet.</p> : passports.map(p => (
                <div key={p.id} style={{ background: "rgba(0,0,0,0.5)", padding: "20px", borderRadius: "10px", border: "1px solid #333" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ color: "#00f2fe", fontWeight: "bold" }}>Token #{p.id}</span>
                    <span style={{ fontSize: "12px", background: "#333", padding: "3px 8px", borderRadius: "10px" }}>{p.status}</span>
                  </div>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "white" }}><strong>Owner:</strong> {p.ownerName}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "white" }}><strong>Model:</strong> {p.manufacturer} {p.model}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "white" }}><strong>Health:</strong> <span style={{color: p.healthPercentage > 80 ? "#10b981" : "#f59e0b"}}>{p.healthPercentage}%</span></p>
                  
                  {/* QR Code and Magic Link */}
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "15px" }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${websiteURL}/?verify=${p.id}`} 
                      alt={`QR for Token ${p.id}`} 
                      style={{ width: "60px", height: "60px", borderRadius: "5px", background: "white", padding: "2px" }} 
                    />
                    <a href={`/?verify=${p.id}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", color: "white", textDecoration: "none", background: "#3b82f6", padding: "10px", borderRadius: "5px", fontSize: "14px", fontWeight: "bold" }}>
                      View Certificate ↗
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