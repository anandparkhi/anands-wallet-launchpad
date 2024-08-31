import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, Keypair, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

const Launchpad = () => {
    const wallet = useWallet();
    const [formData, setFormData] = useState({
        ticker: '',
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
            const mint = Keypair.generate();
            const mintAuthority = wallet.publicKey;
            const freezeAuthority = wallet.publicKey;
    
           
            if (!mintAuthority || !freezeAuthority) {
                alert("Invalid mint or freeze authority.");
                return;
            }
    
            const mintToken = await createMint(
                connection,
                wallet, 
                mintAuthority,
                freezeAuthority,
                parseInt(formData.decimals),
                mint 
            );
    
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet,
                mintToken,
                wallet.publicKey
            );
    
            await mintTo(
                connection,
                wallet,
                mintToken,
                tokenAccount.address,
                wallet, 
                parseInt(formData.suply) * Math.pow(10, parseInt(formData.decimals))
            );
    
            setCreatedTokens([...createdTokens, {
                mintAddress: mint.publicKey.toString(),
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
