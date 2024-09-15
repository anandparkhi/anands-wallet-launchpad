/* eslint-env es2020 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import {
  MINT_SIZE,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Import MUI components
import {
  Typography,
  TextField,
  Button,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';

import LinkIcon from '@mui/icons-material/Link';

const Launchpad = () => {
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    ticker: '',
    supply: '',
    decimals: 0,
    telegramLink: '',
    twitterLink: '',
  });
  const [createdTokens, setCreatedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [network] = useState('devnet');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createToken = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet.');
      return;
    }

    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Wallet not fully initialized or lacks necessary permissions.');
      return;
    }

    setLoading(true);
    setError('');
    const connection = new Connection(clusterApiUrl(network), 'confirmed');

    try {
      const mintKeypair = Keypair.generate();

      // Calculate the rent-exempt amount for the mint account
      const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      // Create a transaction to create and initialize the mint account
      const transaction = new Transaction().add(
        // Create the mint account
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        // Initialize the mint account
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          parseInt(formData.decimals),
          wallet.publicKey, // Mint authority
          wallet.publicKey // Freeze authority
        )
      );

      // Set transaction fee payer and recent blockhash
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Partially sign the transaction with the mint keypair
      transaction.partialSign(mintKeypair);

      // Send the transaction
      await wallet.sendTransaction(transaction, connection);

      // Get the associated token account address
      const associatedTokenAddress = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey
      );

      // Create a transaction to create the associated token account
      const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // Payer
          associatedTokenAddress,
          wallet.publicKey, // Owner
          mintKeypair.publicKey
        )
      );

      // Send the transaction
      await wallet.sendTransaction(transaction2, connection);

      // Create a transaction to mint tokens to the associated token account
      const transaction3 = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          wallet.publicKey, // Mint authority
          BigInt(parseInt(formData.supply) * Math.pow(10, parseInt(formData.decimals)))
        )
      );

      // Send the transaction
      await wallet.sendTransaction(transaction3, connection);

      // Update the state with the new token information
      setCreatedTokens([
        ...createdTokens,
        {
          mintAddress: mintKeypair.publicKey.toString(),
          ticker: formData.ticker,
          supply: formData.supply,
          decimals: formData.decimals,
        },
      ]);

      // Clear the form
      setFormData({
        ticker: '',
        supply: '',
        decimals: 0,
        telegramLink: '',
        twitterLink: '',
      });
    } catch (error) {
      console.error('Error creating token:', error);
      setError('Failed to create token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Token Launchpad
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Ticker"
            name="ticker"
            value={formData.ticker}
            onChange={handleInputChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        {/* Additional fields can be added here if needed */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Initial Supply"
            name="supply"
            type="number"
            value={formData.supply}
            onChange={handleInputChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Decimals"
            name="decimals"
            type="number"
            value={formData.decimals}
            onChange={handleInputChange}
            fullWidth
            variant="outlined"
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
            onClick={createToken}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Create Token'}
          </Button>
        </Grid>
      </Grid>
      {createdTokens.length > 0 && (
        <div>
          <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
            Created Tokens
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="created tokens table">
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Mint Address</TableCell>
                  <TableCell>Supply</TableCell>
                  <TableCell>Decimals</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {createdTokens.map((token, index) => (
                  <TableRow key={index}>
                    <TableCell>{token.ticker}</TableCell>
                    <TableCell> <IconButton
                        component="a"
                        href={`https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon /></IconButton></TableCell>
                    <TableCell>{token.supply}</TableCell>
                    <TableCell>{token.decimals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
};

export default Launchpad;
