// src/adapters/CustomWalletAdapter.js

import { BaseMessageSignerWalletAdapter, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';

export class CustomWebWalletAdapter extends BaseMessageSignerWalletAdapter {
    constructor() {
        super();
        this._publicKey = null;
        this._connected = false;
    }

    get publicKey() {
        return this._publicKey;
    }

    get connected() {
        return this._connected;
    }

    async connect() {
        if (this._connected) return;
        try {
            const wallets = await window.customWebWallet.connect();
            if (wallets.length === 0) {
                throw new Error('No wallets available');
            }
            const selectedPublicKey = await window.customWebWallet.promptUserToSelectWallet(wallets);
            this._publicKey = new PublicKey(selectedPublicKey);
            this._connected = true;
            this.emit('connect', this._publicKey);
        } catch (error) {
            console.error('Connection failed', error);
            throw new WalletNotConnectedError();
        }
    }

    async disconnect() {
        if (!this._connected) return;
        try {
            await window.customWebWallet.disconnect(this._publicKey?.toString() || '');
            this._publicKey = null;
            this._connected = false;
            this.emit('disconnect');
        } catch (error) {
            console.error('Disconnection failed', error);
            throw error;
        }
    }

    async sendTransaction(transaction, connection, options) {
        if (!this._connected || !this._publicKey) {
            throw new WalletNotConnectedError();
        }
        try {
            const keypair = window.customWebWallet.getKeypair(this._publicKey.toString());
            transaction.feePayer = this._publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.sign(keypair);
            const signature = await connection.sendRawTransaction(transaction.serialize(), options);
            return signature;
        } catch (error) {
            console.error('Transaction failed', error);
            throw error;
        }
    }

    async signTransaction(transaction) {
        if (!this._connected || !this._publicKey) {
            throw new WalletNotConnectedError();
        }
        try {
            const keypair = window.customWebWallet.getKeypair(this._publicKey.toString());
            transaction.sign(keypair);
            return transaction;
        } catch (error) {
            console.error('Signing transaction failed', error);
            throw error;
        }
    }
}

export default CustomWebWalletAdapter;
