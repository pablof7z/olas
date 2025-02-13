import { NDKEvent, NDKKind, NDKNutzap, zapInvoiceFromEvent } from "@nostr-dev-kit/ndk-mobile";
import { create } from "zustand";

export type ReactionStats = {
    reactionCount: number;
    reactedByUser: NDKEvent | null;
    commentCount: number;
    commentedByUser: boolean;
    comments: NDKEvent[];
    repostCount: number;
    repostedByUser: boolean;
    reposts: NDKEvent[];
    zapEvents: NDKEvent[];
    zappedAmount: number;
    zappedByUser: boolean;
    bookmarkedByUser: boolean;
}

type ReactionsStore = {
    seenEventIds: Set<string>;
    
    // Map of event ID to reaction stats
    reactions: Map<string, ReactionStats>;
    
    // Add events to the store and update stats
    addEvent: (event: NDKEvent, currentPubkey?: string | boolean) => void;
    
    // Clear all data
    clear: () => void;
}

export const DEFAULT_STATS: ReactionStats = {
    reactionCount: 0,
    reactedByUser: null,
    commentCount: 0,
    commentedByUser: false,
    comments: [],
    repostCount: 0,
    repostedByUser: false,
    reposts: [],
    zapEvents: [],
    zappedAmount: 0,
    zappedByUser: false,
    bookmarkedByUser: false,
} as const;

export const useReactionsStore = create<ReactionsStore>((set, get) => ({
    seenEventIds: new Set(),
    reactions: new Map(),

    addEvent: (event: NDKEvent, currentPubkey?: string | boolean) => {
        set(state => {
            if (state.seenEventIds.has(event.id)) return state;
            state.seenEventIds.add(event.id);

            const newReactions = new Map(state.reactions);

            // Get the event being reacted to
            // we prefer using the E tag, but if there is no E tag, we use the e tag
            let targetRootEventId: string | undefined;
            let targetEventId: string | undefined;
            for (const tag of event.tags) {
                if (tag[0] === 'E') {
                    targetRootEventId = tag[1];
                    break;
                } else if (tag[0] === 'e' && !targetEventId) {
                    targetEventId = tag[1];
                }
            }
            targetRootEventId ??= targetEventId;
            if (!targetRootEventId) {
                console.log(`\t[REACTIONS STORE] no target root event id for`, event.id.substring(0, 8), event.kind, event.encode());
                return state;
            }

            // console.log('adding event', targetRootEventId, event.kind, event.encode());

            // Get or create stats for this event
            const stats = {...(newReactions.get(targetRootEventId) || DEFAULT_STATS)};
            
            switch (event.kind) {
                case NDKKind.Reaction:
                    if (event.pubkey === currentPubkey || currentPubkey === true) {
                        if (!stats.reactedByUser) {
                            stats.reactionCount++;
                            stats.reactedByUser = event;
                        } else if (event.created_at > stats.reactedByUser.created_at) {
                            stats.reactedByUser = event;
                        }
                    } else {
                        stats.reactionCount++;
                    }
                    break;
                case NDKKind.GenericRepost:
                case NDKKind.Repost:
                    stats.repostCount++;
                    if (event.pubkey === currentPubkey || currentPubkey === true) {
                        stats.repostedByUser = true;
                    }
                    stats.reposts.push(event);
                    break;
                case NDKKind.Text:
                case NDKKind.GenericReply:
                    stats.commentCount++;
                    if (event.pubkey === currentPubkey || currentPubkey === true) {
                        stats.commentedByUser = true;
                    }
                    stats.comments.push(event);
                    break;
                case NDKKind.Nutzap:
                    const nutzap = NDKNutzap.from(event);
                    if (!nutzap) return state;
                    stats.zappedAmount += nutzap.amount;
                    if (nutzap.pubkey === currentPubkey || currentPubkey === true) {
                        stats.zappedByUser = true;
                    }
                    stats.zapEvents.push(event);
                    break;
                case NDKKind.Zap:
                    const invoice = zapInvoiceFromEvent(event);
                    stats.zappedAmount += (invoice.amount / 1000); // zap invoices are in msats
                    if (invoice.zappee === currentPubkey || currentPubkey === true) {
                        stats.zappedByUser = true;
                    }
                    stats.zapEvents.push(event);
                    break;
                case 3006:
                    if (event.pubkey === currentPubkey || currentPubkey === true) {
                        stats.bookmarkedByUser = true;
                    }
            }
            newReactions.set(targetRootEventId, stats);

            return { reactions: newReactions };
        });
    },

    clear: () => set({ reactions: new Map() })
}));
