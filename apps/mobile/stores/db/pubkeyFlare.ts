import { db } from '.';

export type PubkeyFlareRecord = {
    pubkey: string;
    flare: string;
};

export const getAllPubkeyFlares = (): Map<string, string> => {
    const map = new Map<string, string>();
    const flares = db.getAllSync('SELECT * FROM pubkey_flares') as PubkeyFlareRecord[];
    for (const flare of flares) {
        map.set(flare.pubkey, flare.flare);
    }
    return map;
};

export const setPubkeyFlare = (pubkey: string, flare: string) => {
    db.runSync('INSERT OR REPLACE INTO pubkey_flares (pubkey, flare) VALUES (?, ?)', [pubkey, flare]);
};

export const deletePubkeyFlare = (pubkey: string) => {
    db.runSync('DELETE FROM pubkey_flares WHERE pubkey = ?', [pubkey]);
};

export const clearPubkeyFlares = () => {
    db.runSync('DELETE FROM pubkey_flares');
};

export const getPubkeyFlare = (pubkey: string): string | null => {
    const flare = db.getFirstSync('SELECT flare FROM pubkey_flares WHERE pubkey = ?', [pubkey]) as PubkeyFlareRecord;
    return flare?.flare ?? null;
};
