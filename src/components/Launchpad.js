import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, Keypair, Transaction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Web3Storage } from 'web3.storage';

const Launchpad = () => {
    const wallet = useWallet();
    const [formData, setFormData] = useState({
        ticker: '',
        supply: '',
        decimals: 0,
        telegramLink: '',
        twitterLink: '',
        imageFile: null
    });
    const [createdTokens, setCreatedTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize Web3.Storage client with your token
    const client = new Web3Storage({ token: 'z6MkmQquwi9tAyR5gH2435oVQ7iaiobCXvRa7kK9EVXzkeiT' });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (event) => {
        setFormData(prev => ({ ...prev, imageFile: event.target.files[0] }));
    };

    const uploadToIPFS = async (file) => {
        const cid = await client.put([file], {
            name: file.name,
            maxRetries: 3
        });
        return `https://${cid}.ipfs.dweb.link/${file.name}`;
    };

    const createToken = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet.");
            return;
        }
        if (!formData.imageFile) {
            alert("Please upload an image for the token.");
            return;
        }
        setLoading(true);
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const mint = Keypair.generate();

        try {
            // Upload image to IPFS first
            const imageUrl = await uploadToIPFS(formData.imageFile);

            const token = new Token(
                connection,
                mint.publicKey,
                TOKEN_PROGRAM_ID,
                wallet  // Assumes wallet can sign transactions
            );

            const tx = new Transaction().add(
                Token.createCreateMintInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    parseInt(formData.decimals),
                    wallet.publicKey,  // Mint authority
                    wallet.publicKey   // Freeze authority
                ),
                Token.createMintToInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, wallet.publicKey),
                    wallet.publicKey,  // Wallet public key as mint authority
                    [],
                    parseInt(formData.supply) * Math.pow(10, parseInt(formData.decimals))
                )
            );

            const signature = await wallet.sendTransaction(tx, connection, {signers: [mint]});
            await connection.confirmTransaction(signature, 'confirmed');

            setCreatedTokens([...createdTokens, {
                mintAddress: mint.publicKey.toString(),
                ticker: formData.ticker,
                supply: formData.supply,
                decimals: formData.decimals,
                imageUrl: imageUrl
            }]);
        } catch (error) {
            console.error('Error creating token:', error);
            alert('Failed to create token: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1>Token Launchpad</h1>
            <input type="text" name="ticker" value={formData.ticker} onChange={handleInputChange} placeholder="Ticker" />
            <input type="number" name="supply" value={formData.supply} onChange={handleInputChange} placeholder="Initial Supply" />
            <input type="number" name="decimals" value={formData.decimals} onChange={handleInputChange} placeholder="Decimals" />
            <input type="text" name="telegramLink" value={formData.telegramLink} onChange={handleInputChange} placeholder="Telegram Link" />
            <input type="text" name="twitterLink" value={formData.twitterLink} onChange={handleInputChange} placeholder="Twitter Link" />
            <input type="file" onChange={handleFileChange} />
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
                            <th>Image</th>
                        </tr>
                    </thead>
                    <tbody>
                        {createdTokens.map((token, index) => (
                            <tr key={index}>
                                <td>{token.ticker}</td>
                                <td>{token.mintAddress}</td>
                                <td>{token.supply}</td>
                                <td>{token.decimals}</td>
                                <td><img src={token.imageUrl} alt={token.ticker} style={{ width: '50px', height: '50px' }} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Launchpad;
