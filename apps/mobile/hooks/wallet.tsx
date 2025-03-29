import { toast } from '@backpackapp-io/react-native-toast';
import type NDK from '@nostr-dev-kit/ndk-mobile';
import {
    type Hexpubkey,
    NDKCacheAdapterSqlite,
    type NDKCashuMintList,
    NDKKind,
    NDKSubscriptionCacheUsage,
    useNDK,
    useNDKCurrentUser,
    useNDKNutzapMonitor,
    useNDKSessionEventKind,
    useNDKWallet,
} from '@nostr-dev-kit/ndk-mobile';
import {
    NDKCashuWallet,
    NDKNWCWallet,
    type NDKWallet,
    migrateCashuWallet,
} from '@nostr-dev-kit/ndk-wallet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

import { useAppSettingsStore } from '@/stores/app';
import { db } from '@/stores/db';
import { dbGetMintInfo, dbGetMintKeys, dbSetMintInfo, dbSetMintKeys } from '@/stores/db/cashu';
import { usePaymentStore } from '@/stores/payments';
import { useDebounce } from '@/utils/debounce';

const start = Date.now();
function log(message: string) {
    console.log(`[WALLET HOOK, ${Date.now() - start}ms] ${message}`);
}

interface Nip60WalletStoreState {
    wallet: NDKCashuWallet | undefined;
    init: (ndk: NDK, pubkey: Hexpubkey) => void;
}

export const useNip60WalletStore = create<Nip60WalletStoreState>((set, _get) => ({
    wallet: undefined,

    init: (ndk: NDK, pubkey: Hexpubkey) => {
        const loadingEventIds = new Set<string>();

        log(`init nip60 wallet, ${pubkey}`);

        ndk.subscribe(
            [{ kinds: [NDKKind.CashuWallet], authors: [pubkey] }],
            {
                subId: 'nip60-wallet',
                skipVerification: true,
            },
            undefined,
            {
                onEvent: (event) => {
                    log(`onEvent, ${event.id}`);
                    if (loadingEventIds.has(event.id)) return;

                    loadingEventIds.add(event.id);
                    NDKCashuWallet.from(event)
                        .then((newWallet) => set({ wallet: newWallet }))
                        .catch((e) =>
                            console.error(
                                'error loading nip60 wallet',
                                e,
                                JSON.stringify(event.rawEvent(), null, 4)
                            )
                        );
                },
            }
        );
    },
}));

export function useNip60Wallet() {
    return useNip60WalletStore((state) => state.wallet);
}

/**
 * This wallet monitor keeps all known proofs from a NIP-60 wallet in a local database.
 */
export function useWalletMonitor(ndk: NDK, pubkey: Hexpubkey) {
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const nip60Wallet = useNip60Wallet();
    const walletType = useAppSettingsStore((s) => s.walletType);
    const walletPayload = useAppSettingsStore((s) => s.walletPayload);
    const setCurrentUser = usePaymentStore((s) => s.setCurrentUser);

    useEffect(() => {
        setCurrentUser(pubkey);
    }, [pubkey]);

    useEffect(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.onMintInfoLoaded = (mint, mintInfo) => {
            dbSetMintInfo(mint, mintInfo);
        };

        activeWallet.onMintKeysLoaded = (mint, keyMap) => {
            for (const [keysetId, keys] of keyMap.entries()) {
                dbSetMintKeys(mint, keysetId, keys);
            }
        };

        activeWallet.onMintInfoNeeded = (mint) => {
            const mintInfo = dbGetMintInfo(mint);
            if (mintInfo) return Promise.resolve(mintInfo);
            return Promise.resolve(undefined);
        };

        activeWallet.onMintKeysNeeded = (mint) => {
            const keys = dbGetMintKeys(mint);
            return Promise.resolve(keys);
        };
    }, [activeWallet?.walletId]);

    const setWalletConfig = useAppSettingsStore((s) => s.setWalletConfig);

    useEffect(() => {
        if (activeWallet) {
            setWalletConfig(activeWallet);
        }
    }, [activeWallet?.walletId]);

    const initWallet = useCallback(async () => {
        if (!pubkey) return;
        let wallet: NDKWallet | undefined;

        log(`initWallet, ${walletType}, ${walletPayload}`);

        if (walletType === 'none') return;
        else if (walletType === 'nwc' && walletPayload) {
            wallet = new NDKNWCWallet(ndk, { pairingCode: walletPayload });
        } else if (nip60Wallet) {
            const cacheAdapter = ndk.cacheAdapter;
            let since: number | undefined;
            if (cacheAdapter instanceof NDKCacheAdapterSqlite) {
                const { db } = cacheAdapter;
                const mostRecentCachedEvent = db.getFirstSync(
                    'SELECT created_at FROM events WHERE kind = ? AND pubkey = ? ORDER BY created_at DESC LIMIT 1',
                    [NDKKind.CashuToken, pubkey]
                ) as { created_at: number };
                since = mostRecentCachedEvent?.created_at;
            }
            log(`initWallet, starting nip60 wallet, ${since}`);
            nip60Wallet.start({ subId: 'wallet', skipVerification: true, since });
            wallet = nip60Wallet;
        } else {
            return;
        }

        setActiveWallet(wallet);
    }, [pubkey, !!nip60Wallet, walletType, walletPayload]);

    useEffect(() => {
        if (!pubkey || activeWallet) return;

        initWallet();
    }, [pubkey, activeWallet?.walletId, nip60Wallet]);

    const updateStorage = useCallback(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;
        if (typeof activeWallet.walletId !== 'string') return; // Skip if walletId is not valid

        const allProofs = activeWallet.state.getProofEntries({
            onlyAvailable: false,
            includeDeleted: true,
        });

        db.withTransactionSync(() => {
            for (const proofEntry of allProofs) {
                const { proof, mint, tokenId, state } = proofEntry;

                const a =
                    'INSERT OR REPLACE into nip60_wallet_proofs ' +
                    '(wallet_id, proof_c, mint, token_id, state, raw, created_at) ' +
                    'VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT (wallet_id, proof_c, mint) ' +
                    'DO UPDATE SET state = ?, updated_at = CURRENT_TIMESTAMP';
                // Ensure tokenId is a string (not undefined)
                const safeTokenId = tokenId ?? '';
                db.runSync(
                    a,
                    activeWallet.walletId,
                    proof.C,
                    mint,
                    safeTokenId,
                    state,
                    JSON.stringify(proof),
                    state
                );
            }
        });
    }, [activeWallet?.walletId]);

    const debouncedUpdateStorage = useDebounce(updateStorage, 1000);

    useEffect(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.on('balance_updated', () => {
            debouncedUpdateStorage?.();
        });
    }, [debouncedUpdateStorage]);
}

/**
 * Hook to monitor and process nutzaps automatically
 */
export function useNutzapMonitor(ndk: NDK, pubkey: Hexpubkey) {
    const [start, setStart] = useState(false);
    const { activeWallet } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList);
    const { nutzapMonitor } = useNDKNutzapMonitor(mintList, start);
    const cashuWallet = useNip60Wallet();
    const [hasOldWallets, setHasOldWallets] = useState<boolean | null>(null);

    useEffect(() => {
        if (!cashuWallet || !nutzapMonitor) return;
        if (activeWallet instanceof NDKCashuWallet) return;

        nutzapMonitor.wallet = activeWallet;
    }, [cashuWallet, nutzapMonitor, activeWallet]);

    useEffect(() => {
        ndk.fetchEvents({ kinds: [NDKKind.LegacyCashuWallet], authors: [pubkey] }).then(
            (events) => {
                const nonDeleted = Array.from(events.values()).filter(
                    (event) => !event.hasTag('deleted')
                );
                const hasNonDeleted = nonDeleted.length > 0;
                setHasOldWallets(hasNonDeleted);
                if (hasNonDeleted) {
                    toast('Migrating nostr-wallets, this may take some time');
                    migrateCashuWallet(ndk).then(() => setHasOldWallets(false));
                }
            }
        );
    }, [!!ndk, pubkey]);

    useEffect(() => {
        // if we need to do a migration, don't start
        if (hasOldWallets !== false) return;

        // don't start if already started
        if (start) return;
        if (!activeWallet?.walletId) return;

        setTimeout(() => {
            setStart(true);
        }, 2000);
    }, [pubkey, start, hasOldWallets, activeWallet?.walletId]);
}
