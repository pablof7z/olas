import { useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCallback, useEffect } from "react";
import { db } from "@/stores/db";
import { useDebounce } from "@/utils/debounce";

/**
 * This wallet monitor keeps all known proofs from a NIP-60 wallet in a local database.
 */
export function useWalletMonitor() {
    const { activeWallet } = useNDKWallet();

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
            debouncedUpdateStorage();
        })
    }, [debouncedUpdateStorage])
}