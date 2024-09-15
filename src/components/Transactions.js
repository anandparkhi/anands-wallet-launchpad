import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

const Transactions = () => {
  const wallet = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [network] = useState('devnet');

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (wallet.connected && wallet.publicKey) {
        const connection = new Connection(clusterApiUrl(network), 'confirmed');
        const walletAddress = wallet.publicKey.toBase58();
        console.log('Fetching transactions for:', walletAddress);

        try {
          const confirmedSignatures = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 20 });
          console.log('Confirmed Signatures:', confirmedSignatures);

          const transactionsDetails = await Promise.all(
            confirmedSignatures.map((signatureInfo) =>
              connection.getParsedTransaction(signatureInfo.signature)
            )
          );
          console.log('Detailed Transactions:', transactionsDetails);

          const filteredTransactions = transactionsDetails
            .filter(Boolean)
            .map((transaction) => {
              if (!transaction || !transaction.meta) return null;

              const preBalances = transaction.meta.preBalances;
              const postBalances = transaction.meta.postBalances;
              const involvedAccounts = transaction.transaction.message.accountKeys.map((acc) => acc.pubkey.toBase58());

              const amountTransferred = Math.abs(preBalances[0] - postBalances[0]) / LAMPORTS_PER_SOL;
              return {
                timestamp: new Date(transaction.blockTime * 1000).toLocaleString(),
                fromWallet: involvedAccounts[0],
                toWallet: involvedAccounts[1],
                amountTransferred: amountTransferred.toFixed(2),
                link: `https://explorer.solana.com/tx/${transaction.transaction.signatures[0]}?cluster=devnet`,
              };
            })
            .filter((tx) => tx && (tx.fromWallet === walletAddress || tx.toWallet === walletAddress));

          setTransactions(filteredTransactions);
        } catch (err) {
          console.error('Error fetching transactions:', err);
          setError('Failed to fetch transactions.');
        }
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [wallet.connected, wallet.publicKey, network]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page whenever rows per page changes
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Recent Transactions
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : transactions.length > 0 ? (
        <TableContainer component={Paper}>
          <Table aria-label="transactions table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>From Wallet</TableCell>
                <TableCell>To Wallet</TableCell>
                <TableCell>Amount Transferred (SOL)</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell>{tx.timestamp}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{tx.fromWallet}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{tx.toWallet}</TableCell>
                    <TableCell>{tx.amountTransferred}</TableCell>
                    <TableCell>
                      <IconButton
                        component="a"
                        href={tx.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      ) : (
        <Typography>No transactions found</Typography>
      )}
    </div>
  );
};

export default Transactions;
