import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

const Dashboard = () => {
    const wallet = useWallet();
    const [balance, setBalance] = useState(0);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [transactionSignature, setTransactionSignature] = useState('');
    const [network] = useState('devnet'); 
    useEffect(() => {
        const fetchBalance = async () => {
            if (wallet.connected && wallet.publicKey) {
                const connection = new Connection(clusterApiUrl(network), 'confirmed');
                try {
                    const newBalance = await connection.getBalance(wallet.publicKey);
                    setBalance(newBalance / LAMPORTS_PER_SOL);  // Convert from lamports to SOL
                } catch (error) {
                    console.error('Failed to fetch balance:', error);
                }
            }
        };

        fetchBalance();
    }, [wallet.connected, wallet.publicKey, network]);

    const sendTransaction = async () => {
        if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction || !recipient || !amount) return;

        const connection = new Connection(clusterApiUrl(network), 'confirmed');
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(recipient),
                lamports: parseFloat(amount) * LAMPORTS_PER_SOL
            })
        );

        try {
            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            setTransactionSignature(signature);
            setShowModal(true);
        } catch (error) {
            console.error('Transaction error', error);
            alert('Transaction failed: ' + error.message);
        }
    };

    return (
        <div>
            <h1>Welcome to Solana Wallet Adapter</h1>
            <div>Your balance: {balance.toFixed(2)} SOL</div>

            <input type="text" placeholder="Recipient's Public Key" value={recipient} onChange={e => setRecipient(e.target.value)} />
            <input type="number" placeholder="Amount in SOL" value={amount} onChange={e => setAmount(e.target.value)} />
            <button onClick={sendTransaction} disabled={!wallet.connected || !recipient || !amount}>
                Send SOL
            </button>
            {showModal && (
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', border: '1px solid black', borderRadius: '8px' }}>
                    <p>Transaction successful! Signature:</p>
                    <p>{transactionSignature}</p>
                    <a href={`https://solscan.io/tx/${transactionSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                        View on SolScan
                    </a>
                    <button onClick={() => setShowModal(false)}>Close</button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
