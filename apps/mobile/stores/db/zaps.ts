import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { db } from "./index";

type NWCZap = {
    preimage: string;
    recipient_pubkey: string;
    recipient_event_id: string;
    zap_type: string;
    created_at: number;
    updated_at: number;
    pending_payment_id: string;
    amount: number;
}

export function addNWCZap({ target, recipientPubkey, pr, preimage, zapType, pendingPaymentId }: { target: NDKEvent | NDKUser, recipientPubkey: string, pr: string, preimage?: string, zapType: string, pendingPaymentId?: string }) {
    const id = target instanceof NDKEvent ? target.tagId() : target.pubkey;
    db.runSync(
        `INSERT INTO nwc_zaps (pr, preimage, recipient_pubkey, recipient_event_id, zap_type, created_at, updated_at, pending_payment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [pr, preimage ?? "", recipientPubkey, id, zapType, new Date().getTime() / 1000, new Date().getTime() / 1000, pendingPaymentId ?? ""]
    )
}

export function getNWCZap(pr: string): NWCZap | undefined {
    return db.getFirstSync<NWCZap>(`SELECT * FROM nwc_zaps WHERE pr = ?;`, [pr]);
}

export function getNWCZapsByPendingPaymentId(pendingPaymentId: string): NWCZap | undefined {
    return db.getFirstSync<NWCZap>(`SELECT * FROM nwc_zaps WHERE pending_payment_id = ?;`, [pendingPaymentId]);
}
