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

const Launchpad = () => {
    const wallet = useWallet();
    const [formData, setFormData] = useState({
        ticker: '',
        name: '',
        supply: '',
        decimals: 0,
        telegramLink: '',
        twitterLink: ''
    });
    const [createdTokens, setCreatedTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const createToken = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet.");
            return;
        }

        if (!wallet.publicKey || !wallet.signTransaction) {
            alert("Wallet not fully initialized or lacks necessary permissions.");
            return;
        }

        setLoading(true);
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

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
                    wallet.publicKey  // Freeze authority
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
            setCreatedTokens([...createdTokens, {
                mintAddress: mintKeypair.publicKey.toString(),
                ticker: formData.ticker,
                supply: formData.supply,
                decimals: formData.decimals
            }]);

        } catch (error) {
            console.error('Error creating token:', error);
            alert('Failed to create token: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Token Launchpad</h1>
            <input type="text" name="ticker" value={formData.ticker} onChange={handleInputChange} placeholder="Ticker" />
            <input type="number" name="supply" value={formData.supply} onChange={handleInputChange} placeholder="Initial Supply" />
            <input type="number" name="decimals" value={formData.decimals} onChange={handleInputChange} placeholder="Decimals" />
            <input type="text" name="telegramLink" value={formData.telegramLink} onChange={handleInputChange} placeholder="Telegram Link" />
            <input type="text" name="twitterLink" value={formData.twitterLink} onChange={handleInputChange} placeholder="Twitter Link" />
            <button onClick={createToken} disabled={loading}>Create Token</button>
            {loading && <p>Loading...</p>}
            <div>
                <h2>Created Tokens</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Mint Address</th>
                            <th>Supply</th>
                            <th>Decimals</th>
                        </tr>
                    </thead>
            
                    <tbody>
                        {createdTokens.map((token, index) => (
                            <tr key={index}>
                                <td>{token.ticker}</td>
                                <td>{token.mintAddress}</td>
                                <td>{token.supply}</td>
                                <td>{token.decimals}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Launchpad;
