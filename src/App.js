import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { wallets } from './wallets';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Launchpad from './components/Launchpad'; 
import './App.css';

function App() {
  const network = clusterApiUrl('devnet');
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets()} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <WalletMultiButton />
            <div className="tab-buttons">
              <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
              <button onClick={() => setActiveTab('transactions')}>Transactions</button>
              <button onClick={() => setActiveTab('launchpad')}>Token Launchpad</button>
            </div>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'launchpad' && <Launchpad />} 
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
