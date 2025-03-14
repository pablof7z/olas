import { NDKCacheAdapterSqlite, NDKKind, useNDK, useNDKCurrentUser, useNDKSessionEventKind, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet, NDKNWCWallet, NDKWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/stores/db";
import { useDebounce } from "@/utils/debounce";
import { useAppSettingsStore } from "@/stores/app";
import { dbGetMintInfo, dbGetMintKeys, dbSetMintInfo, dbSetMintKeys } from "@/stores/db/cashu";
import { usePaymentStore } from "@/stores/payments";
import { atom, useAtom } from "jotai";
import { useNDKNutzapMonitor, NDKCashuMintList } from "@nostr-dev-kit/ndk-mobile";
import { toast } from "@backpackapp-io/react-native-toast";
import { migrateCashuWallet } from "@nostr-dev-kit/ndk-wallet";

// Define an atom for the wallet instance to prevent race conditions
const walletAtom = atom<NDKCashuWallet | undefined>(undefined);
// Define an atom to track loading state by event ID
const loadingEventIdsAtom = atom<Set<string>>(new Set<string>());

export function useNip60Wallet() {
    const [wallet, setWallet] = useAtom(walletAtom);
    const [loadingEventIds, setLoadingEventIds] = useAtom(loadingEventIdsAtom);
    const event = useNDKSessionEventKind(NDKKind.CashuWallet);

    useEffect(() => {
        // If no event, nothing to do
        if (!event) return;
        
        // If we already have the correct wallet instance, use it
        if (wallet?.event && event.created_at! <= wallet.event.created_at!) {
            return;
        }
        
        // If already loading this event ID, skip duplicate processing
        if (loadingEventIds.has(event.id)) return;
        
        // Start loading process for new wallet
        const newLoadingIds = new Set(loadingEventIds);
        newLoadingIds.add(event.id);
        setLoadingEventIds(newLoadingIds);
        
        NDKCashuWallet.from(event)
            .then((newWallet) => {
                console.log('new wallet in useNip60Wallet', event.id);
                if (newWallet) {
                    // Store in the atom
                    setWallet(newWallet);
                }
            })
            .catch(e => console.error('error loading nip60 wallet', e, JSON.stringify(event.rawEvent(), null, 4)))
            .finally(() => {
                // Remove this event ID from loading set
                const newLoadingIds = new Set(loadingEventIds);
                newLoadingIds.delete(event.id);
                setLoadingEventIds(newLoadingIds);
            });
    }, [event?.id, wallet, loadingEventIds, setWallet, setLoadingEventIds]);

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
            return Promise.resolve(undefined);
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

    const updateStorage = useCallback(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;
        if (typeof activeWallet.walletId !== 'string') return; // Skip if walletId is not valid

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
                // Ensure tokenId is a string (not undefined)
                const safeTokenId = tokenId ?? '';
                db.runSync(a, activeWallet.walletId, proof.C, mint, safeTokenId, state, JSON.stringify(proof), state);
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

/**
 * Hook to monitor and process nutzaps automatically
 */
export function useNutzapMonitor() {
    const [start, setStart] = useState(false);
    const { activeWallet } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList);
    const { nutzapMonitor } = useNDKNutzapMonitor(mintList, start);
    const currentUser = useNDKCurrentUser();
    const {ndk} = useNDK();
    const [hasOldWallets, setHasOldWallets] = useState<boolean | null>(null);
    const cashuWallet = useNip60Wallet();

    useEffect(() => {
        if (!cashuWallet || !nutzapMonitor) return;
        if (activeWallet instanceof NDKCashuWallet) return;

        console.log('adding privkeys from cashu wallet to monitor', cashuWallet.privkeys.size, activeWallet?.walletId);

        nutzapMonitor.wallet = activeWallet;
    }, [cashuWallet, nutzapMonitor, activeWallet])

    useEffect(() => {
        if (!ndk || !currentUser) return;

        ndk.fetchEvents({ kinds: [NDKKind.LegacyCashuWallet], authors: [currentUser.pubkey]}).then((events) => {
            const nonDeleted = Array.from(events.values()).filter((event) => !event.hasTag('deleted'));
            const hasNonDeleted = nonDeleted.length > 0;
            setHasOldWallets(hasNonDeleted);
            if (hasNonDeleted) {
                toast("Migrating nostr-wallets, this may take some time");
                migrateCashuWallet(ndk).then(() => setHasOldWallets(false));
            }
        });
    }, [!!ndk, currentUser?.pubkey])

    useEffect(() => {
        // don't start until there's a user
        if (!currentUser?.pubkey) return;

        // if we need to do a migration, don't start
        if (hasOldWallets !== false) return;

        // don't start if already started
        if (start) return;

        // don't start if we don't have an active wallet
        console.log('activeWallet in monitor', activeWallet?.walletId);
        if (!activeWallet?.walletId) return;
        console.log('starting monitor');

        setTimeout(() => {
            console.log('setting start to true');
            setStart(true)
        }, 2000);
    }, [currentUser?.pubkey, start, hasOldWallets, activeWallet?.walletId])
}