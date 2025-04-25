import type { Hexpubkey } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';

import { db } from '.';

interface PrivateFollowsStore {
    pubkeys: Set<Hexpubkey>;
    setPubkeys: (pubkeys: Set<Hexpubkey>) => void;
    add: (pubkey: Hexpubkey) => void;
    remove: (pubkey: Hexpubkey) => void;
}

export const usePrivateFollows = create<PrivateFollowsStore>((set) => ({
    pubkeys: new Set(),

    // initialize the store with the state of the database
    init: () => {
        const pubkeys = getPrivateFollows();
        set({ pubkeys });
    },

    setPubkeys: (pubkeys) => set({ pubkeys }),

    // add a pubkey to the store and update the database
    add: (pubkey) =>
        set((state) => {
            if (state.pubkeys.has(pubkey)) return state;
            const newPubkeys = new Set(state.pubkeys);
            newPubkeys.add(pubkey);
            db.runSync('INSERT INTO private_follows (pubkey, created_at) VALUES (?, ?)', [
                pubkey,
                Math.floor(Date.now() / 1000),
            ]);
            return { pubkeys: newPubkeys };
        }),

    // remove a pubkey from the store and update the database
    remove: (pubkey) =>
        set((state) => {
            const newPubkeys = new Set(state.pubkeys);
            newPubkeys.delete(pubkey);
            db.runSync('DELETE FROM private_follows WHERE pubkey = ?', [pubkey]);
            return { pubkeys: newPubkeys };
        }),
}));

export default usePrivateFollows;

function getPrivateFollows() {
    const pubkeys = db.getAllSync('SELECT pubkey FROM private_follows') as { pubkey: string }[];
    return new Set(pubkeys.map((row) => row.pubkey));
}
