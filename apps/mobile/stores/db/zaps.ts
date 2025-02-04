import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { db } from "./index";

type NWCZap = {
    preimage: string;
    recipient_pubkey: string;
    recipient_event_id: string;
    zap_type: string;
    created_at: number;
    updated_at: number;
}

export function addNWCZap(event: NDKEvent, recipientPubkey: string, zapType: string) {
    db.runSync(
        `INSERT INTO nwc_zaps (preimage, recipient_pubkey, recipient_event_id, zap_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);`,
        [event.id, recipientPubkey, event.id, zapType, new Date().getTime(), new Date().getTime()]
    )
}

export function getNWCZap(preimage: string): NWCZap | undefined {
    return db.getFirstSync<NWCZap>(`SELECT * FROM nwc_zaps WHERE preimage = ?;`, [preimage]);
}
