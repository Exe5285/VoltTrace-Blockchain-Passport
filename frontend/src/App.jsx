import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BatteryPassport from './BatteryPassport.json';

// 🔴 PASTE YOUR TERMINAL ADDRESS HERE 🔴
const contractAddress = "0x0259c8D98bB5EF7E8b6298eb7eaEc007e8328ef1"; 

function App() {
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('');
  const [allPassports, setAllPassports] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeTab, setActiveTab] = useState('home');

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
    if (!manufacturer || !model) {
      setStatus("⚠️ Please enter make and spec.");
      return;
    }
    
    try {
      if (!window.ethereum) return alert("Please install MetaMask!");
      setIsMinting(true);
      setStatus("⏳ Signing Transaction...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, signer);

      const today = new Date().toISOString().split('T')[0];
      const tx = await contract.createPassport("https://example.com", manufacturer, model, today);
      
      setStatus("⚡ Deploying to Blockchain Ledger...");
      await tx.wait();
      
      setStatus("✅ Passport Minted Successfully!");
      setManufacturer(''); 
      setModel('');
      
      fetchAllPassports(); 
    } catch (error) {
      console.error(error);
      setStatus("❌ Transaction failed.");
    } finally {
      setIsMinting(false);
      setTimeout(() => setStatus(''), 5000);
    }
  }

  async function fetchAllPassports() {
    if (!window.ethereum) return;
    setIsFetching(true);
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, BatteryPassport.abi, provider);

    try {
      let tempList = [];
      let id = 0;

      while (true) {
        try {
          const data = await contract.batteries(id);
          if (data[0] === "") break; 

          tempList.push({
            id: id,
            manufacturer: data[0],
            model: data[1],
            date: data[2]
          });
          id++; 
        } catch (error) {
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
    <div style={{ 
      /* Absolute full screen styling */
      position: "absolute", 
      top: 0, 
      left: 0, 
      width: "100vw", 
      minHeight: "100vh", 
      fontFamily: "'Poppins', sans-serif", 
      background: "linear-gradient(135deg, #1a0b3e 0%, #0d041a 100%)", 
      color: "white", 
      display: "flex", 
      flexDirection: "column",
      overflowX: "hidden"
    }}>
      
      <style>{`
        body { margin: 0 !important; padding: 0 !important; overflow-x: hidden; }
        
        /* Navigation (Futuristic 3D) */
        .header { background: rgba(26, 11, 62, 0.6); padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .logo { font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; background: linear-gradient(to right, #00f2fe, #ff00de); -webkit-background-clip: text; color: transparent; cursor: pointer; text-shadow: 0 0 15px rgba(0, 242, 254, 0.5); }
        .nav-links { display: flex; gap: 30px; }
        .nav-item { cursor: pointer; font-weight: 700; color: #a1a1aa; transition: all 0.2s; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
        .nav-item:hover, .nav-item.active { color: white; text-shadow: 0 0 10px white; }
        .connect-btn { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #0d041a; border: none; padding: 10px 25px; border-radius: 30px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 13px; box-shadow: 0 5px 15px rgba(0, 242, 254, 0.4); transition: transform 0.2s; }
        .connect-btn:hover { transform: scale(1.05); }

        /* Hero (Colorful 3D) */
        .hero { padding: 100px 20px; text-align: center; background: radial-gradient(circle at center, rgba(111, 66, 193, 0.3) 0%, rgba(13, 4, 26, 0) 70%); }
        .hero-title { font-size: 4rem; font-weight: 900; line-height: 1; text-transform: uppercase; letter-spacing: -2px; background: linear-gradient(to bottom, #ffffff, #a1a1aa); -webkit-background-clip: text; color: transparent; margin-bottom: 20px; }
        .hero-subtitle { font-size: 1.4rem; color: #a1a1aa; max-width: 750px; margin: 0 auto 50px; line-height: 1.6; }
        .cta-button { background: linear-gradient(135deg, #ff00de 0%, #ff61dc 100%); color: white; font-size: 1.2rem; padding: 18px 50px; border: none; border-radius: 50px; font-weight: 900; cursor: pointer; text-transform: uppercase; box-shadow: 0 10px 30px rgba(255, 0, 222, 0.4); transition: all 0.3s ease; position: relative; }
        .cta-button:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(255, 0, 222, 0.6); }
        .cta-button::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50px; box-shadow: inset 0 3px 5px rgba(255,255,255,0.5), inset 0 -3px 5px rgba(0,0,0,0.3); opacity: 0.8; }

        /* Features (Interactive Tilt 3D) */
        .features { padding: 100px 50px; perspective: 1000px; }
        .section-title { font-size: 3rem; text-align: center; text-transform: uppercase; font-weight: 900; letter-spacing: -1px; margin-bottom: 70px; background: linear-gradient(to right, #ffffff, #a1a1aa); -webkit-background-clip: text; color: transparent; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; max-width: 1200px; margin: 0 auto; }
        
        .feature-card { padding: 40px; border-radius: 30px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border: 2px solid rgba(255,255,255,0.1); transition: all 0.4s ease; transform-style: preserve-3d; box-shadow: 0 15px 35px rgba(0,0,0,0.3); position: relative; overflow: hidden; }
        .feature-card:hover { transform: rotateY(10deg) rotateX(5deg) translateY(-10px); border-color: #00f2fe; box-shadow: 0 25px 50px rgba(0, 242, 254, 0.2); }
        .feature-card::before { content: ''; position: absolute; top: -50px; left: -50px; width: 100px; height: 100px; background: rgba(0, 242, 254, 0.2); filter: blur(40px); border-radius: 50%; opacity: 0; transition: opacity 0.4s; }
        .feature-card:hover::before { opacity: 1; }
        
        .feature-icon { font-size: 4rem; margin-bottom: 25px; transform: translateZ(30px); }
        .feature-title { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 15px; transform: translateZ(20px); text-transform: uppercase; }
        .feature-desc { color: #a1a1aa; line-height: 1.7; font-size: 15px; transform: translateZ(10px); }

        /* Dashboard App (Vibrant 3D Panel) */
        .app-container { max-width: 1300px; margin: 50px auto; padding: 0 20px 80px; display: grid; grid-template-columns: 1fr 2.3fr; gap: 40px; flex-grow: 1; perspective: 1500px; }
        .app-panel { background: rgba(255, 255, 255, 0.02); padding: 40px; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px); position: relative; }
        .app-panel::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 30px; box-shadow: inset 0 2px 3px rgba(255,255,255,0.1), inset 0 -2px 3px rgba(0,0,0,0.4); pointer-events: none; }
        .app-title { font-size: 1.8rem; font-weight: 900; margin-bottom: 30px; text-transform: uppercase; letter-spacing: -1px; color: white; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px; }
        
        .input-block { margin-bottom: 25px; }
        .input-block label { display: block; font-weight: 700; margin-bottom: 10px; color: #a1a1aa; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
        .input-block input { width: 100%; padding: 18px; background: rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.05); border-radius: 15px; box-sizing: border-box; font-size: 1rem; color: white; transition: all 0.3s; box-shadow: inset 0 3px 5px rgba(0,0,0,0.3); }
        .input-block input:focus { outline: none; border-color: #ff00de; box-shadow: inset 0 3px 5px rgba(0,0,0,0.3), 0 0 15px rgba(255, 0, 222, 0.3); }
        
        .mint-btn { width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 18px; border-radius: 15px; font-size: 1.2rem; font-weight: 900; cursor: pointer; transition: all 0.3s; text-transform: uppercase; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); position: relative; }
        .mint-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(16, 185, 129, 0.6); }
        .mint-btn::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 15px; box-shadow: inset 0 3px 4px rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.3); opacity: 0.7; }
        .mint-btn:disabled { background: #475569; box-shadow: none; cursor: not-allowed; opacity: 0.5; }

        .passport-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
        .passport-item { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); border: 2px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); transition: all 0.3s ease; position: relative; overflow: hidden; }
        .passport-item:hover { transform: translateY(-5px) rotateX(3deg); border-color: rgba(0, 242, 254, 0.3); box-shadow: 0 15px 35px rgba(0, 242, 254, 0.15); background: rgba(255,255,255,0.05); }
        .passport-item::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 20px; box-shadow: inset 0 2px 3px rgba(255,255,255,0.05); pointer-events: none; }
        
        .p-id { font-size: 11px; color: #00f2fe; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: inline-block; background: rgba(0, 242, 254, 0.1); padding: 5px 12px; border-radius: 20px; }
        .p-make { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 5px; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        .p-model { color: #a1a1aa; margin-bottom: 20px; font-size: 15px; }
        .p-date { font-size: 12px; color: #71717a; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; display: flex; justify-content: space-between; }

        /* Footer */
        .footer { background: #07020d; color: #52525b; text-align: center; padding: 40px; margin-top: auto; border-top: 2px solid rgba(255,255,255,0.03); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
      `}</style>

      {/* --- 1. NAV --- */}
      <header className="header">
        <div className="logo" onClick={() => setActiveTab('home')}>
          VoltTrace
        </div>
        
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Network</div>
          <div className={`nav-item ${activeTab === 'app' ? 'active' : ''}`} onClick={() => setActiveTab('app')}>Live Dashboard</div>
        </div>

        <div>
          {walletAddress ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0, 242, 254, 0.1)", border: "1px solid rgba(0, 242, 254, 0.3)", padding: "8px 18px", borderRadius: "30px", fontWeight: "700", color: "#00f2fe", fontSize: "14px" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "#00f2fe", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #00f2fe" }}></span>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>Authorize Wallet</button>
          )}
        </div>
      </header>

      {/* --- 2. HOME --- */}
      {activeTab === 'home' && (
        <>
          <div className="hero">
            <h1 className="hero-title">Immutable Battery Provenance</h1>
            <p className="hero-subtitle">
              A cutting-edge Web3 solution for tracking the complete lifecycle of Electric Vehicle battery packs using decentralized, immutable blockchain ledger technology.
            </p>
            <button className="cta-button" onClick={() => setActiveTab('app')}>
              Launch Node Dashboard
            </button>
          </div>

          <div className="features">
            <h2 className="section-title">Next-Gen Blockchain Ledger</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">Immutable Tokens</h3>
                <p className="feature-desc">Provenance data is minted as native ERC-721 tokens on the Ethereum network, ensuring original specifications can never be altered or forged.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌈</div>
                <h3 className="feature-title">Vibrant Transparency</h3>
                <p className="feature-desc">Instant public verification of a battery's origin, make, model, and production timestamp for consumers, OEMs, and recyclers globally.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚙️</div>
                <h3 className="feature-title">Smart Contracts</h3>
                <p className="feature-desc">Secured by audited Solidity smart contracts. Eliminates centralized databases and single points of failure for automated lifecycle tracking.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- 3. APP --- */}
      {activeTab === 'app' && (
        <div className="app-container">
          
          <div className="app-panel">
            <div className="app-title">Issue Digital Passport</div>
            
            <div className="input-block">
              <label>MANUFACTURER BRAND</label>
              <input 
                placeholder="e.g., TATA, TESLA, BYD" 
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                disabled={isMinting}
              />
            </div>
            
            <div className="input-block">
              <label>BATTERY SPECIFICATION</label>
              <input 
                placeholder="e.g., Nexon EV 30.2kWh LFP" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isMinting}
              />
            </div>

            <button className="mint-btn" onClick={createPassport} disabled={isMinting}>
              {isMinting ? "⚙️ Minting on Blockchain..." : "Mint ERC-721 Token"}
            </button>

            {status && (
              <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", textAlign: "center", fontWeight: "700", fontSize: "14px", color: status.includes("❌") ? "#ff6161" : "#00f2fe" }}>
                {status}
              </div>
            )}
          </div>

          <div className="app-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "15px" }}>
              <div className="app-title" style={{ border: "none", margin: 0, padding: 0 }}>Decentralized Registry</div>
              <button 
                onClick={fetchAllPassports} 
                disabled={isFetching}
                style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.05)", color: "white", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}
              >
                {isFetching ? "Syncing..." : "↻ Sync Ledger"}
              </button>
            </div>

            <div className="passport-list">
              {allPassports.length === 0 && !isFetching && (
                <div style={{ color: "#71717a", padding: "30px", textAlign: "center", gridColumn: "1 / -1" }}>No battery passports have been minted on this network yet.</div>
              )}
              
              {allPassports.map((p) => (
                <div key={p.id} className="passport-item">
                  <div className="p-id">Token ID #{p.id}</div>
                  <div className="p-make">{p.manufacturer}</div>
                  <div className="p-model">{p.model}</div>
                  <div className="p-date">
                    <span>MINT TIMESTAMP</span>
                    <span style={{color: "white"}}>{p.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- 4. FOOTER --- */}
      <footer className="footer">
        <p>VoltTrace Ledger Network • Final Year Engineering Project • 2026</p>
      </footer>

    </div>
  );
}

export default App;