import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { create } from 'zustand';

type WalletStoreState = {
    activeWallet: NDKCashuWallet | null;
    setActiveWallet: (wallet?: NDKCashuWallet) => void;
}

/** Store */
export const walleteStore = create<WalletStoreState>((set) => ({
    activeWallet: null,
    setActiveWallet(wallet?: NDKCashuWallet): void {
        set(() => ({ activeWallet: wallet }))
    }
}));