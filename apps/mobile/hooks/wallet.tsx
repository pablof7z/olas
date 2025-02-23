import { NDKCacheAdapterSqlite, NDKKind, useNDK, useNDKCurrentUser, useNDKSessionEventKind, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet, NDKNWCWallet, NDKWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/stores/db";
import { useDebounce } from "@/utils/debounce";
import { useAppSettingsStore } from "@/stores/app";
import { dbGetMintInfo, dbGetMintKeys, dbSetMintInfo, dbSetMintKeys } from "@/stores/db/cashu";
import { usePaymentStore } from "@/stores/payments";

export function useNip60Wallet() {
    const [ wallet, setWallet ] = useState<NDKCashuWallet | undefined>(undefined);
    const event = useNDKSessionEventKind(NDKKind.CashuWallet);

    useEffect(() => {
        if (event) {
            NDKCashuWallet.from(event)
                .then(setWallet)
                .catch(e => console.error('error loading nip60 wallet', e));
        }
    }, [event])

    return wallet;
}

/**
 * This wallet monitor keeps all known proofs from a NIP-60 wallet in a local database.
 */
export function useWalletMonitor() {
    const {ndk} = useNDK();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const nip60Wallet = useNip60Wallet();
    const currentUser = useNDKCurrentUser();
    const timer = useRef<NodeJS.Timeout | null>(null);
    const walletType = useAppSettingsStore(s => s.walletType);
    const walletPayload = useAppSettingsStore(s => s.walletPayload);
    const setCurrentUser = usePaymentStore(s => s.setCurrentUser);

    useEffect(() => {
        setCurrentUser(currentUser?.pubkey);
    }, [currentUser?.pubkey])

    

    useEffect(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.onMintInfoLoaded = (mint, mintInfo) => {
            dbSetMintInfo(mint, mintInfo);
        }

        activeWallet.onMintKeysLoaded = (mint, keyMap) => {
            for (const [keysetId, keys] of keyMap.entries()) {
                dbSetMintKeys(mint, keysetId, keys);
            }
        }
        
        activeWallet.onMintInfoNeeded = (mint) => {
            const mintInfo = dbGetMintInfo(mint);
            if (mintInfo) return Promise.resolve(mintInfo);
        }
        
        activeWallet.onMintKeysNeeded = (mint) => {
            const keys = dbGetMintKeys(mint);
            return Promise.resolve(keys);
        }

    }, [activeWallet?.walletId])

    const setWalletConfig = useAppSettingsStore(s => s.setWalletConfig);

    useEffect(() => {
        if (activeWallet) {
            setWalletConfig(activeWallet);
        }
    }, [ activeWallet?.walletId ])
    
    const delayedInitWallet = useCallback(async () => {
        if (!currentUser?.pubkey) return;
        let wallet: NDKWallet | undefined;

        if (walletType === 'none') return;
        else if (walletType === 'nwc' && walletPayload) {
            wallet = new NDKNWCWallet(ndk, { pairingCode: walletPayload });
        } else if (nip60Wallet) {
            const cacheAdapter = ndk.cacheAdapter;
            let since: number | undefined;
            if ((cacheAdapter instanceof NDKCacheAdapterSqlite)) {
                const { db } = cacheAdapter;
                const mostRecentCachedEvent = db.getFirstSync('SELECT created_at FROM events WHERE kind = ? AND pubkey = ? ORDER BY created_at DESC LIMIT 1', [NDKKind.CashuToken, currentUser.pubkey]) as { created_at: number };
                since = mostRecentCachedEvent?.created_at;
            }
            nip60Wallet.start({ subId: 'wallet', skipVerification: true, since });
            wallet = nip60Wallet;
        } else {
            return;
        }

        setActiveWallet(wallet);
    }, [currentUser?.pubkey, !!nip60Wallet, walletType, walletPayload])

    useEffect(() => {
        if (!currentUser?.pubkey || activeWallet) return;

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            delayedInitWallet();
        }, 1000);
    }, [currentUser?.pubkey, activeWallet?.walletId, nip60Wallet])

    // useEffect(() => {
    //     if (!activeWallet) return;

    //     console.log('[WALLET MONITOR] wallet became active', activeWallet.walletId, activeWallet.balance());
    //     activeWallet.updateBalance?.().then(() => {
    //         console.log('[WALLET MONITOR] wallet balance updated', activeWallet.walletId, activeWallet.balance());
    //     })
        
    // }, [activeWallet?.walletId]);

    const updateStorage = useCallback(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        const allProofs = activeWallet.state.getProofEntries({
            onlyAvailable: false,
            includeDeleted: true
        })

        db.withTransactionSync(() => {
            for (const proofEntry of allProofs) {
                const {proof, mint, tokenId, state} = proofEntry;
                const a = `INSERT OR REPLACE into nip60_wallet_proofs ` +
                          `(wallet_id, proof_c, mint, token_id, state, raw, created_at) `+
                          `VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT (wallet_id, proof_c, mint) `+
                          `DO UPDATE SET state = ?, updated_at = CURRENT_TIMESTAMP`;
                db.runSync(a, activeWallet.walletId, proof.C, mint, tokenId, state, JSON.stringify(proof), state);
            }
        });
    }, [activeWallet?.walletId])

    const debouncedUpdateStorage = useDebounce(updateStorage, 1000);

    useEffect(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.on('balance_updated', () => {
            console.log('wallet monitor balance updated');
            debouncedUpdateStorage?.();
        })
    }, [debouncedUpdateStorage])
}