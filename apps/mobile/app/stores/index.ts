import { NDKEvent } from "@nostr-dev-kit/ndk";
import { create } from 'zustand';
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";

type ActiveEventStoreState = {
    activeEvent: NDKEvent | null;
    setActiveEvent: (event?: NDKEvent) => void;
}

/** Store */
export const activeEventStore = create<ActiveEventStoreState>((set) => ({
    activeEvent: null,
    setActiveEvent(event?: NDKEvent): void {
        set(() => ({ activeEvent: event }))
    }
}));

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