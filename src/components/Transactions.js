import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconButton } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

const Transactions = () => {
    const wallet = useWallet();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (wallet.connected && wallet.publicKey) {
                const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                const walletAddress = wallet.publicKey.toBase58();
                console.log("Fetching transactions for:", walletAddress);

                try {
                    const confirmedSignatures = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 20 });
                    console.log("Confirmed Signatures:", confirmedSignatures);

                    const transactionsDetails = await Promise.all(
                        confirmedSignatures.map(signatureInfo =>
                            connection.getParsedTransaction(signatureInfo.signature)
                        )
                    );
                    console.log("Detailed Transactions:", transactionsDetails);

                    const filteredTransactions = transactionsDetails.filter(Boolean).map(transaction => {
                        if (!transaction || !transaction.meta) return null;

                        const preBalances = transaction.meta.preBalances;
                        const postBalances = transaction.meta.postBalances;
                        const involvedAccounts = transaction.transaction.message.accountKeys.map(acc => acc.pubkey.toBase58());

                        const amountTransferred = Math.abs(preBalances[0] - postBalances[0]) / LAMPORTS_PER_SOL;
                        return {
                            timestamp: new Date(transaction.blockTime * 1000).toLocaleString(),
                            fromWallet: involvedAccounts[0],
                            toWallet: involvedAccounts[1],
                            amountTransferred: amountTransferred.toFixed(2),
                            link: `https://explorer.solana.com/tx/${transaction.transaction.signatures[0]}?cluster=devnet`
                        };
                    }).filter(tx => tx && (tx.fromWallet === walletAddress || tx.toWallet === walletAddress));

                    setTransactions(filteredTransactions);
                } catch (err) {
                    console.error('Error fetching transactions:', err);
                    setError('Failed to fetch transactions.');
                }
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [wallet.connected, wallet.publicKey]);

    return (
        <div>
            <h2>Recent Transactions</h2>
            {loading ? <p>Loading transactions...</p> : error ? <p>{error}</p> : (
                transactions.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>From Wallet</th>
                                <th>To Wallet</th>
                                <th>Amount Transferred (SOL)</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx, index) => (
                                <tr key={index}>
                                    <td>{tx.timestamp}</td>
                                    <td>{tx.fromWallet}</td>
                                    <td>{tx.toWallet}</td>
                                    <td>{tx.amountTransferred}</td>
                                    <td>
                                        <IconButton component="a" href={tx.link} target="_blank" rel="noopener noreferrer">
                                            <LinkIcon />
                                        </IconButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No transactions found</p>
            )}
        </div>
    );
};

export default Transactions;
