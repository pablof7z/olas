import type { GetInfoResponse, MintKeys } from '@cashu/cashu-ts';

import { db } from '.';

export function dbGetMintInfo(url: string) {
    const res = db.getFirstSync<{ payload: string }>(
        'SELECT payload FROM mint_info WHERE url = ?',
        [url]
    );
    if (!res) return null;
    return JSON.parse(res.payload);
}

export function dbSetMintInfo(url: string, payload: GetInfoResponse) {
    db.runSync('INSERT OR REPLACE INTO mint_info (url, payload) VALUES (?, ?)', [
        url,
        JSON.stringify(payload),
    ]);
}

export function dbGetMintKeys(url: string) {
    const res = db.getAllSync<{ payload: string }>('SELECT payload FROM mint_keys WHERE url = ?', [
        url,
    ]);
    const keys = res.map((r) => JSON.parse(r.payload));
    return keys as MintKeys[];
}

export function dbSetMintKeys(url: string, keysetId: string, keys: MintKeys) {
    db.runSync('DELETE FROM mint_keys WHERE url = ? AND keyset_id = ?', [url, keysetId]);
    db.runSync('INSERT INTO mint_keys (url, keyset_id, payload) VALUES (?, ?, ?)', [
        url,
        keysetId,
        JSON.stringify(keys),
    ]);
}
