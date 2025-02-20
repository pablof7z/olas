import { CashuMint, GetInfoResponse } from "@cashu/cashu-ts";
import { useEffect, useState } from "react";
import { dbGetMintInfo, dbSetMintInfo } from "../stores/db/cashu";

let activeMintFetches = new Map<string, Promise<GetInfoResponse>>();

export function useMintInfo(url?: string) {
    const fromDb = url ? dbGetMintInfo(url) : null;
    
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
        mint.getInfo().then((info) => {
            if (!valid) return;
            setMintInfo(info);
            dbSetMintInfo(url, info);
        }).finally(() => {
            setLoading(false);
        });

        return () => {
            valid = false;
        };
    }, [url]);

    return { mintInfo, loading };
}