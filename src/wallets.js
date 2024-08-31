import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import CustomWebWalletAdapter from './adapters/CustomWebWalletAdapter';

export const wallets = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CustomWebWalletAdapter(), 
  ];
};
