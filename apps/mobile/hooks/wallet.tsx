import { useNDK, useNDKCurrentUser, useNDKSessionEventKind, useNDKSessionEventKindAsync, useNDKSessionInitWallet, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCallback, useEffect, useRef } from "react";
import { db } from "@/stores/db";
import { useDebounce } from "@/utils/debounce";
import {settingsStore} from "@/lib/settings-store";

/**
 * This wallet monitor keeps all known proofs from a NIP-60 wallet in a local database.
 */
export function useWalletMonitor() {
    const {ndk} = useNDK();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const nip60Wallet = useNDKSessionEventKindAsync<NDKCashuWallet>(NDKCashuWallet);
    const currentUser = useNDKCurrentUser();
    const initWallet = useNDKSessionInitWallet();
    const timer = useRef<NodeJS.Timeout | null>(null);

    const delayedInitWallet = useCallback(() => {
        if (!currentUser?.pubkey) return;

        const walletInSetting = settingsStore.getSync('wallet');
        if (walletInSetting) {
            initWallet(ndk, settingsStore);
        } else if (nip60Wallet) {
            setActiveWallet(nip60Wallet);
        }
    }, [currentUser?.pubkey, nip60Wallet])

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