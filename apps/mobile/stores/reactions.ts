import { NDKEvent, NDKKind, NDKNutzap, zapInvoiceFromEvent } from "@nostr-dev-kit/ndk-mobile";
import { create } from "zustand";

export type ReactionStats = {
    reactionCount: number;
    reactedByUser: NDKEvent | null;
    commentCount: number;
    commentedByUser: boolean;
    comments: NDKEvent[];
    repostedBy: Set<string>;
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

    addEvents: (events: NDKEvent[], currentPubkey?: string | boolean) => void;
    
    // Clear all data
    clear: () => void;
}

export const DEFAULT_STATS: ReactionStats = {
    reactionCount: 0,
    reactedByUser: null,
    commentCount: 0,
    commentedByUser: false,
    comments: [],
    reposts: [],
    repostedBy: new Set(),
    repostedByUser: false,
    zapEvents: [],
    zappedAmount: 0,
    zappedByUser: false,
    bookmarkedByUser: false,
} as const;

export const useReactionsStore = create<ReactionsStore>((set, get) => ({
    seenEventIds: new Set(),
    reactions: new Map(),

    addEvent: (event: NDKEvent, currentPubkey?: string | boolean) => {
        set((state: ReactionsStore) => {
            // Skip if already processed
            if (state.seenEventIds.has(event.id)) return state;

            // Create new copies
            const newSeenEventIds = new Set(state.seenEventIds);
            newSeenEventIds.add(event.id);
            const newReactions = new Map(state.reactions);

            const targetRootEventId = getTargetRootEventId(event);
            if (!targetRootEventId) {
                console.log(
                    `[REACTIONS STORE] no target root event id for`,
                    event.id.substring(0, 8),
                    event.kind,
                    event.encode()
                );
                return state;
            }

            let stats = cloneReactionStats(newReactions.get(targetRootEventId) || DEFAULT_STATS);
            updateStats(stats, event, currentPubkey);
            newReactions.set(targetRootEventId, stats);

            return { seenEventIds: newSeenEventIds, reactions: newReactions };
        });
    },

    addEvents: (events: NDKEvent[], currentPubkey?: string | boolean) => {
        set((state: ReactionsStore) => {
            const newSeenEventIds = new Set(state.seenEventIds);
            const newReactions = new Map(state.reactions);

            for (const event of events) {
                if (newSeenEventIds.has(event.id)) continue;
                newSeenEventIds.add(event.id);

                const targetRootEventId = getTargetRootEventId(event);
                if (!targetRootEventId) {
                    console.log(
                        `[REACTIONS STORE] no target root event id for`,
                        event.id.substring(0, 8),
                        event.kind,
                        event.encode()
                    );
                    continue;
                }

                
                const stats = cloneReactionStats(newReactions.get(targetRootEventId) || DEFAULT_STATS);
                updateStats(stats, event, currentPubkey);
                newReactions.set(targetRootEventId, stats);
            }

            return { seenEventIds: newSeenEventIds, reactions: newReactions };
        });
    },

    clear: () => set({ reactions: new Map() })
}));


function getTargetRootEventId(event: NDKEvent): string | undefined {
    let targetRootEventId: string | undefined;
    let targetEventId: string | undefined;
    for (const tag of event.tags) {
        if (tag[0] === "E") {
            targetRootEventId = tag[1];
            break;
        } else if (tag[0] === "e" && !targetEventId) {
            targetEventId = tag[1];
        }
    }
    return targetRootEventId ?? targetEventId;
}

function updateStats(
    stats: ReactionStats,
    event: NDKEvent,
    currentPubkey?: string | boolean
): void {
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
            stats.repostedBy.add(event.pubkey);
            stats.reposts.push(event);
            if (event.pubkey === currentPubkey || currentPubkey === true) {
                stats.repostedByUser = true;
            }
            break;
        case NDKKind.Text:
        case NDKKind.GenericReply:
            stats.commentCount++;
            if (event.pubkey === currentPubkey || currentPubkey === true) {
                stats.commentedByUser = true;
            }
            stats.comments.push(event);
            break;
        case NDKKind.Nutzap: {
            const nutzap = NDKNutzap.from(event);
            if (!nutzap) return;
            stats.zappedAmount += nutzap.amount;
            if (nutzap.pubkey === currentPubkey || currentPubkey === true) {
                stats.zappedByUser = true;
            }
            stats.zapEvents.push(nutzap);
            break;
        }
        case NDKKind.Zap: {
            const invoice = zapInvoiceFromEvent(event);
            stats.zappedAmount += invoice.amount / 1000; // zap invoices are in msats
            if (invoice.zappee === currentPubkey || currentPubkey === true) {
                stats.zappedByUser = true;
            }
            stats.zapEvents.push(event);
            break;
        }
        case 3006:
            if (event.pubkey === currentPubkey || currentPubkey === true) {
                stats.bookmarkedByUser = true;
            }
            break;
    }
}

function cloneReactionStats(stats: ReactionStats): ReactionStats {
    return {
      reactionCount: stats.reactionCount,
      reactedByUser: stats.reactedByUser ? new NDKEvent(stats.reactedByUser.ndk, stats.reactedByUser) : null,
      commentCount: stats.commentCount,
      commentedByUser: stats.commentedByUser,
      comments: [...stats.comments],
      repostedBy: new Set(stats.repostedBy),
      repostedByUser: stats.repostedByUser,
      reposts: [...stats.reposts],
      zapEvents: [...stats.zapEvents],
      zappedAmount: stats.zappedAmount,
      zappedByUser: stats.zappedByUser,
      bookmarkedByUser: stats.bookmarkedByUser,
    };
}