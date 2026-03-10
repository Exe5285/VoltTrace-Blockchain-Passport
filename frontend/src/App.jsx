import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BatteryPassport from './V3_ABI.json';

// Your new V2 Enterprise Contract Address
const contractAddress = "0x248Aa077028c58fF7e21569afa1740BF792f4a18"; 

function App() {
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');
  const [allPassports, setAllPassports] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeTab, setActiveTab] = useState('app');

  useEffect(() => {
    checkWallet();
    if (activeTab === 'app') {
      fetchAllPassports();
    }
  }, [activeTab]);

  async function checkWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWalletAddress(accounts[0]);
  }

  async function createPassport() {
    if (!manufacturer || !model || !capacity) {
      setStatusMsg("⚠️ Please enter Make, Model, and Capacity.");
      return;
    }
    
    try {
      if (!window.ethereum) return alert("Please install MetaMask!");
      setIsMinting(true);
      setStatusMsg("⏳ Signing Transaction...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      const today = new Date().toISOString().split('T')[0];
      // Calling the updated V2 function
      const tx = await contract.createPassport(manufacturer, model, today, capacity);
      
      setStatusMsg("⚡ Deploying to Blockchain Ledger...");
      await tx.wait();
      
      setStatusMsg("✅ Passport Minted Successfully!");
      setManufacturer(''); 
      setModel('');
      setCapacity('');
      
      fetchAllPassports(); 
    } catch (error) {
      console.error(error);
      setStatusMsg("❌ Transaction failed. Are you the Admin?");
    } finally {
      setIsMinting(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }

  async function fetchAllPassports() {
    if (!window.ethereum) return;
    setIsFetching(true);
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, provider);

    const statusMap = ["Manufactured", "Installed in EV", "End of Life", "Recycled"];

    try {
      let tempList = [];
      let id = 0;

      while (true) {
        try {
          const data = await contract.batteries(id);
          if (data[1] === "") break; // If manufacturer string is empty, we reached the end

          tempList.push({
            id: Number(data[0]),
            manufacturer: data[1],
            model: data[2],
            date: data[3],
            capacity: Number(data[4]),
            chargeCycles: Number(data[5]),
            healthPercentage: Number(data[6]),
            status: statusMap[Number(data[7])]
          });
          id++; 
        } catch (error) {
          console.error("Fetch loop failed at ID:", id, error);
          break;
        }
      }
      setAllPassports(tempList.reverse());
    } catch (error) {
      console.error("Error fetching", error);
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", minHeight: "100vh", fontFamily: "'Poppins', sans-serif", background: "linear-gradient(135deg, #1a0b3e 0%, #0d041a 100%)", color: "white", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      
      <style>{`
        body { margin: 0 !important; padding: 0 !important; overflow-x: hidden; }
        .header { background: rgba(26, 11, 62, 0.6); padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .logo { font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; background: linear-gradient(to right, #00f2fe, #ff00de); -webkit-background-clip: text; color: transparent; cursor: pointer; }
        .nav-links { display: flex; gap: 30px; }
        .nav-item { cursor: pointer; font-weight: 700; color: #a1a1aa; transition: all 0.2s; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
        .nav-item:hover, .nav-item.active { color: white; text-shadow: 0 0 10px white; }
        .connect-btn { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #0d041a; border: none; padding: 10px 25px; border-radius: 30px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 13px; box-shadow: 0 5px 15px rgba(0, 242, 254, 0.4); transition: transform 0.2s; }
        .connect-btn:hover { transform: scale(1.05); }

        .app-container { max-width: 1400px; margin: 50px auto; padding: 0 20px 80px; display: grid; grid-template-columns: 1fr 2.5fr; gap: 40px; flex-grow: 1; perspective: 1500px; }
        .app-panel { background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px); }
        .app-title { font-size: 1.6rem; font-weight: 900; margin-bottom: 30px; text-transform: uppercase; letter-spacing: -1px; color: white; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px; }
        
        .input-block { margin-bottom: 20px; }
        .input-block label { display: block; font-weight: 700; margin-bottom: 8px; color: #a1a1aa; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        .input-block input { width: 100%; padding: 15px; background: rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.05); border-radius: 12px; box-sizing: border-box; font-size: 1rem; color: white; transition: all 0.3s; }
        .input-block input:focus { outline: none; border-color: #ff00de; box-shadow: 0 0 15px rgba(255, 0, 222, 0.3); }
        
        .mint-btn { width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 18px; border-radius: 15px; font-size: 1.1rem; font-weight: 900; cursor: pointer; transition: all 0.3s; text-transform: uppercase; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); margin-top: 10px; }
        .mint-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(16, 185, 129, 0.6); }
        .mint-btn:disabled { background: #475569; cursor: not-allowed; opacity: 0.5; }

        .passport-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }
        .passport-item { background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); border: 2px solid rgba(255,255,255,0.05); border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column;}
        
        .card-header { padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); }
        .card-body { padding: 25px; display: flex; gap: 20px; }
        
        .qr-box { width: 90px; height: 90px; background: white; padding: 5px; border-radius: 10px; flex-shrink: 0; }
        .qr-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; }
        .data-item { display: flex; flex-direction: column; }
        .data-label { font-size: 10px; color: #a1a1aa; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
        .data-value { font-size: 14px; font-weight: 700; color: white; }
        .health-bar { width: 100%; height: 6px; background: #3f3f46; border-radius: 3px; margin-top: 5px; overflow: hidden; }
        .health-fill { height: 100%; background: #10b981; border-radius: 3px; }
      `}</style>

      {/* NAV */}
      <header className="header">
        <div className="logo" onClick={() => setActiveTab('home')}>VoltTrace V2</div>
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'app' ? 'active' : ''}`} onClick={() => setActiveTab('app')}>Enterprise Dashboard</div>
        </div>
        <div>
          {walletAddress ? (
            <div style={{ background: "rgba(0, 242, 254, 0.1)", border: "1px solid rgba(0, 242, 254, 0.3)", padding: "8px 18px", borderRadius: "30px", fontWeight: "700", color: "#00f2fe", fontSize: "14px" }}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>Authorize Wallet</button>
          )}
        </div>
      </header>

      {/* APP */}
      {activeTab === 'app' && (
        <div className="app-container">
          
          {/* Admin Minting Panel */}
          <div className="app-panel">
            <div className="app-title">Admin Registry panel</div>
            <div style={{fontSize: "12px", color: "#a1a1aa", marginBottom: "20px"}}>Only the contract owner can mint new passports.</div>
            
            <div className="input-block">
              <label>Manufacturer</label>
              <input placeholder="e.g., TATA" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} disabled={isMinting} />
            </div>
            <div className="input-block">
              <label>Battery Model</label>
              <input placeholder="e.g., Nexon EV 30.2kWh" value={model} onChange={(e) => setModel(e.target.value)} disabled={isMinting} />
            </div>
            <div className="input-block">
              <label>Capacity (kWh)</label>
              <input type="number" placeholder="e.g., 30" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isMinting} />
            </div>

            <button className="mint-btn" onClick={createPassport} disabled={isMinting}>
              {isMinting ? "⚙️ Writing to Ledger..." : "Mint V2 Passport"}
            </button>

            {statusMsg && (
              <div style={{ marginTop: "15px", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", textAlign: "center", fontWeight: "700", fontSize: "13px", color: statusMsg.includes("❌") ? "#ff6161" : "#00f2fe" }}>
                {statusMsg}
              </div>
            )}
          </div>

          {/* Registry & Search Engine */}
          <div className="app-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "15px" }}>
              <div className="app-title" style={{ border: "none", margin: 0, padding: 0 }}>Global Passport Ledger</div>
              <button onClick={fetchAllPassports} disabled={isFetching} style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.05)", color: "white", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
                {isFetching ? "Syncing..." : "↻ Refresh Network"}
              </button>
            </div>

            <div className="passport-list">
              {allPassports.length === 0 && !isFetching && (
                <div style={{ color: "#71717a", textAlign: "center", gridColumn: "1 / -1" }}>No V2 passports minted yet.</div>
              )}
              
              {allPassports.map((p) => (
                <div key={p.id} className="passport-item">
                  <div className="card-header">
                    <span style={{ fontSize: "12px", color: "#00f2fe", fontWeight: "800", letterSpacing: "1px" }}>TOKEN #{p.id}</span>
                    <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "20px", fontWeight: "700", textTransform: "uppercase" }}>{p.status}</span>
                  </div>
                  
                  <div className="card-body">
                    {/* Auto-Generating QR Code API */}
                    <div className="qr-box">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sepolia.etherscan.io/address/${contractAddress}`} alt="QR Code" />
                    </div>
                    
                    <div className="data-grid">
                      <div className="data-item">
                        <span className="data-label">Make</span>
                        <span className="data-value">{p.manufacturer}</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Model</span>
                        <span className="data-value" style={{fontSize:"12px"}}>{p.model}</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Capacity</span>
                        <span className="data-value">{p.capacity} kWh</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Production</span>
                        <span className="data-value">{p.date}</span>
                      </div>
                      
                      {/* Health Bar UI */}
                      <div className="data-item" style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                          <span className="data-label">State of Health (SoH)</span>
                          <span className="data-value" style={{color: p.healthPercentage > 80 ? "#10b981" : "#f59e0b"}}>{p.healthPercentage}%</span>
                        </div>
                        <div className="health-bar">
                          <div className="health-fill" style={{ width: `${p.healthPercentage}%`, background: p.healthPercentage > 80 ? "#10b981" : "#f59e0b" }}></div>
                        </div>
                        <span style={{fontSize: "10px", color: "#a1a1aa", marginTop: "4px"}}>{p.chargeCycles} Lifetime Charge Cycles</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;