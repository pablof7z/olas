import { useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useEffect } from "react";
import { db } from "@/stores/db";

/**
 * This wallet monitor keeps all known proofs from a NIP-60 wallet in a local database.
 */
export function useWalletMonitor() {
    const { activeWallet } = useNDKWallet();

    useEffect(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.on('balance_updated', () => {
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
        })
    }, [activeWallet?.walletId])
}