import { AlphaWalletAdapter, BitgetWalletAdapter, CoinbaseWalletAdapter, LedgerWalletAdapter, PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export const wallets = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BitgetWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new AlphaWalletAdapter(),
    new LedgerWalletAdapter(),

  ];
};
