import type { Hexpubkey } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';

import { db } from '@/stores/db';

interface UserFlareStore {
    flares: Map<Hexpubkey, string>;
    setFlare: (pubkey: Hexpubkey, flare: string) => void;
    setFlares: (pubkeys: Hexpubkey[], flare: string) => void;
    init: () => void;
}

export const useUserFlareStore = create<UserFlareStore>((set, _get) => ({
    flares: new Map(),

    init: () => {
        const flares = db.getAllSync('SELECT * FROM pubkey_flares') as {
            pubkey: string;
            flare_type: string;
        }[];
        const flaresMap = new Map<Hexpubkey, string>();
        for (const flare of flares) {
            flaresMap.set(flare.pubkey, flare.flare_type);
        }
        set({ flares: flaresMap });
    },

    setFlare: (pubkey: Hexpubkey, flare: string) => {
        set((s) => {
            const _flares = new Map(s.flares);
            _flares.set(pubkey, flare);
            console.log('Setting flare', _flares.size);
            return { flares: _flares };
        });
        // db.runSync('INSERT OR REPLACE INTO pubkey_flares (pubkey, flare_type) VALUES (?, ?)', [
        //     pubkey,
        //     flare,
        // ]);
    },

    setFlares: (pubkeys: Hexpubkey[], flare: string) => {
        set((s) => {
            const _flares = new Map(s.flares);
            for (const pubkey of pubkeys) {
                _flares.set(pubkey, flare);
            }
            console.log('Setting flares', _flares.size);
            return { flares: _flares };
        });
    },
}));

export const useUserFlare = (pubkey?: Hexpubkey) => {
    const { flares } = useUserFlareStore();
    if (!pubkey) return undefined;
    return flares.get(pubkey);
};