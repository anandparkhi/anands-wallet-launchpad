import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { wallets } from './wallets';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Launchpad from './components/Launchpad';
import './App.css';

// Import MUI components
import { AppBar, Toolbar, Tabs, Tab, Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

function App() {
  const network = clusterApiUrl('devnet');
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Create a MUI theme if needed
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2', // Customize the primary color
      },
      secondary: {
        main: '#dc004e', // Customize the secondary color
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets()} autoConnect>
          <WalletModalProvider>
            <div className="App">
              <AppBar position="static">
                <Toolbar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      textColor="inherit"
                      indicatorColor="secondary"
                    >
                      <Tab label="Transfer" />
                      <Tab label="Transactions" />
                      <Tab label="Token" />
                    </Tabs>
                  </Box>
                  <WalletMultiButton />
                </Toolbar>
              </AppBar>
              <Box sx={{ padding: 3 }}>
                {activeTab === 0 && <Dashboard />}
                {activeTab === 1 && <Transactions />}
                {activeTab === 2 && <Launchpad />}
              </Box>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;
