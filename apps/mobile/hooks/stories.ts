import {
    type Hexpubkey,
    type NDKEvent,
    type NDKFilter,
    type NDKImage,
    NDKKind,
    NDKStory,
    NDKVideo,
    useFollows,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useMemo, useRef, useState } from 'react';

type StoryEntry = {
    events: NDKEvent[];
    live: boolean;
};

export function useStories() {
    // useSubscribe([
    //     { kinds: [30311] }
    // ], { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, groupable: true, skipVerification: true, subId: 'live-sub', relays: ['wss://relay.damus.io'], dontSaveToCache: true });
    const follows = useFollows();
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 10;
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [{ kinds: [NDKKind.Story], since: twentyFourHoursAgo }];
        if (follows?.length > 0) {
            filters.push({
                kinds: [NDKKind.VerticalVideo, NDKKind.ShortVideo],
                authors: follows,
                since: twentyFourHoursAgo,
            });
        }
        return filters;
    }, [follows?.length]);
    const { events } = useSubscribe<NDKImage | NDKVideo | NDKStory>(
        filters,
        { wrap: true, cacheUnconstrainFilter: [] },
        [filters]
    );

    const [stories, setStories] = useState<Map<Hexpubkey, StoryEntry>>(new Map());
    const knownIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        let changed = false;
        const map = new Map<Hexpubkey, StoryEntry>();

        for (const event of events) {
            // if (knownIds.current.has(event.id)) continue;
            knownIds.current.add(event.id);
            changed = true;

            if (!isInRightTimeframe(event)) continue;

            if (isStory(event) || isLiveEvent(event) || isNDKStory(event)) {
                const pubkey = event.pubkey;
                const current = map.get(pubkey) ?? { events: [], live: false };
                current.events.push(event);
                if (isLiveEvent(event)) {
                    current.live = true;
                }
                map.set(pubkey, current);
            }
        }

        if (changed) {
            setStories(map);
        }
    }, [events.length]);

    return stories;
}

function isStory(event: NDKImage | NDKVideo | NDKStory) {
    // Already an NDKStory event
    if (event.kind === 23) return true;

    const expiration = event.tagValue('expiration');
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const videoInPast24Hours = event instanceof NDKVideo && event.created_at > twentyFourHoursAgo;
    const storyInPast24Hours = event instanceof NDKStory && event.created_at > twentyFourHoursAgo;
    if (!expiration && !videoInPast24Hours && !storyInPast24Hours) return false;

    const firstImeta = event.imetas?.[0];
    if (!firstImeta) return false;

    if (!firstImeta.dim) return false;
    const [width, height] = firstImeta.dim.split('x').map(Number);
    if (!width || !height) return false;
    const isPortrait = width < height;

    return isPortrait;
}

/**
 * Checks if an event is a kind 25 NDKStory
 */
function isNDKStory(event: NDKEvent): boolean {
    return event.kind === NDKKind.Story && event.tags.some((tag) => tag[0] === 'imeta');
}

function isLiveEvent(event: NDKEvent) {
    return event.kind === 30311 && event.tagValue('status') === 'live';
}

function isInRightTimeframe(event: NDKEvent) {
    // must be in the last 24 hours
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - 24 * 60 * 60;
    return event.created_at >= twentyFourHoursAgo && event.created_at <= now;
}
