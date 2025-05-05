import { CashuMint, type GetInfoResponse } from '@cashu/cashu-ts';
import { NDKCacheAdapterSqlite, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useState } from 'react';

const activeMintFetches = new Map<string, Promise<GetInfoResponse>>();

export function useMintInfo(url?: string) {
    const { ndk } = useNDK();
    const cacheAdapter = ndk?.cacheAdapter;
    let fromDb: GetInfoResponse | null = null;
    if (cacheAdapter instanceof NDKCacheAdapterSqlite && url) {
        fromDb = cacheAdapter.getAllMintInfo(url);
    }

    const [mintInfo, setMintInfo] = useState<GetInfoResponse | null>(fromDb);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mintInfo || !url) return;
        let valid = true;

        if (activeMintFetches.has(url)) {
            setLoading(true);
            activeMintFetches.get(url)?.then((info) => {
                if (!valid) return;
                setMintInfo(info);
                setLoading(false);
            });
            return;
        }

        const mint = new CashuMint(url);
        setLoading(true);
        mint.getInfo()
            .then((info) => {
                if (!valid) return;
                setMintInfo(info);
                if (cacheAdapter instanceof NDKCacheAdapterSqlite)
                    cacheAdapter.setMintInfo(url, info);
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {
            valid = false;
        };
    }, [url]);

    return { mintInfo, loading };
}
