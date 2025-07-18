import { NDKEvent, NDKKind, getRootTag } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';

export type ReactionStats = {
    reactionCount: number;
    reactedByUser: NDKEvent | null;
    commentCount: number;
    commentedByUser: boolean;
    comments: NDKEvent[];
    repostedBy: Set<string>;
    repostedByUser: boolean;
    reposts: NDKEvent[];
    bookmarkedByUser: boolean;
};

type ReactionsStore = {
    seenEventIds: Set<string>;

    // Map of event ID to reaction stats
    reactions: Map<string, ReactionStats>;

    addEvents: (events: NDKEvent[], currentPubkey?: string | boolean) => void;

    // Clear all data
    clear: () => void;
};

export const DEFAULT_STATS: ReactionStats = {
    reactionCount: 0,
    reactedByUser: null,
    commentCount: 0,
    commentedByUser: false,
    comments: [],
    reposts: [],
    repostedBy: new Set(),
    repostedByUser: false,
    bookmarkedByUser: false,
} as const;

export const useReactionsStore = create<ReactionsStore>((set, _get) => ({
    seenEventIds: new Set(),
    reactions: new Map(),

    addEvents: (events: NDKEvent[], currentPubkey?: string | boolean) => {
        if (events.length === 0) return; // Early return if no events

        set((state: ReactionsStore) => {
            // Filter out events that are already in the store
            const newEvents = events.filter((event) => !state.seenEventIds.has(event.id));
            if (newEvents.length === 0) return state; // No changes if all events are already seen

            const newSeenEventIds = new Set(state.seenEventIds);
            const newReactions = new Map(state.reactions);

            for (const event of newEvents) {
                // Iterate over newEvents only
                // No need to check newSeenEventIds here as we filtered already
                newSeenEventIds.add(event.id);

                const targetRootEventId = getTargetRootEventId(event);
                if (!targetRootEventId) {
                    continue;
                }

                const stats = cloneReactionStats(
                    newReactions.get(targetRootEventId) || DEFAULT_STATS
                );
                updateStats(stats, event, currentPubkey);
                newReactions.set(targetRootEventId, stats);
            }

            return { seenEventIds: newSeenEventIds, reactions: newReactions };
        });
    },

    clear: () => set({ reactions: new Map() }),
}));

function getTargetRootEventId(event: NDKEvent): string | undefined {
    const rootTag = getRootTag(event);
    return rootTag?.[1];
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
        reactedByUser: stats.reactedByUser
            ? new NDKEvent(stats.reactedByUser.ndk, stats.reactedByUser)
            : null,
        commentCount: stats.commentCount,
        commentedByUser: stats.commentedByUser,
        comments: [...stats.comments],
        repostedBy: new Set(stats.repostedBy),
        repostedByUser: stats.repostedByUser,
        reposts: [...stats.reposts],
        bookmarkedByUser: stats.bookmarkedByUser,
    };
}
