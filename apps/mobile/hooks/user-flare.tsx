import { db } from "@/stores/db";
import { Hexpubkey } from "@nostr-dev-kit/ndk-mobile";
import { create } from "zustand";

interface UserFlareStore {
    flares: Map<Hexpubkey, string>;
    setFlare: (pubkey: Hexpubkey, flare: string) => void;
    init: () => void;
}

export const useUserFlareStore = create<UserFlareStore>((set, get) => ({
    flares: new Map(),

    init: () => {
        const flares = db.getAllSync('SELECT * FROM pubkey_flares') as { pubkey: string, flare_type: string }[];
        const flaresMap = new Map<Hexpubkey, string>();
        for (const flare of flares) {
            flaresMap.set(flare.pubkey, flare.flare_type);
        }
        set({ flares: flaresMap });
    },
    
    setFlare: (pubkey: Hexpubkey, flare: string) => {
        set(s => {
            const _flares = new Map(s.flares);
            _flares.set(pubkey, flare);
            return { flares: _flares };
        });
        db.runSync('INSERT OR REPLACE INTO pubkey_flares (pubkey, flare_type) VALUES (?, ?)', [pubkey, flare]);
    },
}));


export const useUserFlare = (pubkey: Hexpubkey) => {
    const { flares } = useUserFlareStore();
    return flares.get(pubkey);
};