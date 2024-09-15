import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Import MUI components
import {
  Typography,
  TextField,
  Button,
  Modal,
  Box,
  Grid,
  Alert,
} from '@mui/material';

const Dashboard = () => {
  const wallet = useWallet();
  const [balance, setBalance] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState('');
  const [network] = useState('devnet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.connected && wallet.publicKey) {
        const connection = new Connection(clusterApiUrl(network), 'confirmed');
        try {
          const newBalance = await connection.getBalance(wallet.publicKey);
          setBalance(newBalance / LAMPORTS_PER_SOL); // Convert from lamports to SOL
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    };

    fetchBalance();
  }, [wallet.connected, wallet.publicKey, network]);

  const sendTransaction = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction || !recipient || !amount) return;

    setLoading(true);
    setError('');

    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
      })
    );

    try {
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      setTransactionSignature(signature);
      setShowModal(true);
    } catch (error) {
      console.error('Transaction error', error);
      setError('Transaction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transfer Solana
      </Typography>
      <Typography variant="h6">
        Your balance: {balance.toFixed(2)} SOL
      </Typography>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={12}>
          <TextField
            label="Recipient's Public Key"
            variant="outlined"
            fullWidth
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Amount in SOL"
            variant="outlined"
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={sendTransaction}
            disabled={!wallet.connected || !recipient || !amount || loading}
            fullWidth
          >
            {loading ? 'Sending...' : 'Send SOL'}
          </Button>
        </Grid>
      </Grid>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        aria-labelledby="transaction-modal-title"
        aria-describedby="transaction-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="transaction-modal-title" variant="h6" component="h2">
            Transaction successful!
          </Typography>
          <Typography id="transaction-modal-description" sx={{ mt: 2, wordBreak: 'break-all' }}>
            Signature: {transactionSignature}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 2 }}
          >
            View on Solana Explorer
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowModal(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard;
