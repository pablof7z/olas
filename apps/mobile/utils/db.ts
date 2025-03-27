import NDK, { NDKCacheAdapterSqlite, NDKKind, NDKEvent } from '@nostr-dev-kit/ndk-mobile';

/**
 * Get all events by users directly from the local database.
 * @returns
 */
export function getPostsByUser(ndk: NDK, pubkeys: string[]): NDKEvent[] {
    if (!(ndk?.cacheAdapter instanceof NDKCacheAdapterSqlite)) return [];

    const cacheAdapter = ndk.cacheAdapter;
    let postsByUser: NDKEvent[] = [];

    if (pubkeys.length > 100) {
        const pubkeySet = new Set(pubkeys);
        postsByUser = cacheAdapter.getEvents(`SELECT * FROM events WHERE kind = ${NDKKind.Image}`, [], (event) =>
            pubkeySet.has(event.pubkey)
        );
    } else {
        const placeholders = pubkeys.map(() => '?').join(',');
        const query = `SELECT * FROM events WHERE kind = ${NDKKind.Image} AND pubkey IN (${placeholders})`;
        postsByUser = cacheAdapter.getEvents(query, pubkeys);
    }

    return postsByUser;
}
