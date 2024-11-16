import { NDKEvent } from "@nostr-dev-kit/ndk";
import { create } from 'zustand';

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