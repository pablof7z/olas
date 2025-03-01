import { useEffect, useRef, useState } from "react";
import { useObserver } from "./observer";
import { Hexpubkey, NDKEvent, NDKImage } from "@nostr-dev-kit/ndk-mobile";

type StoryEntry = {
    events: NDKEvent[],
    live: boolean,
}

export function useStories() {
    // useSubscribe([
    //     { kinds: [30311] }
    // ], { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, groupable: true, skipVerification: true, subId: 'live-sub', relays: ['wss://relay.damus.io'], dontSaveToCache: true });
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const events = useObserver(
        [{ kinds: [20], since: twentyFourHoursAgo }],
        // [{ kinds: [20, 30311], since: twentyFourHoursAgo }],
        { cacheUnconstrainFilter: [] }
    )

    const [stories, setStories] = useState<Map<Hexpubkey, StoryEntry>>(new Map());
    const knownIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        let changed = false;
        const map = new Map < Hexpubkey, StoryEntry>();

        for (const event of events) {
            if (knownIds.current.has(event.id)) continue;
            knownIds.current.add(event.id);
            changed = true;

            if (isStory(event) || isLiveEvent(event)) {
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
            console.log('stories changed', map.size);
            setStories(map);
        }
    }, [events.length]);

    return stories;
}

function isStory(event: NDKImage) {
    const expiration = event.tagValue('expiration');
    if (!expiration) return false;

    const firstImeta = event.imetas?.[0];
    if (!firstImeta) return false;

    if (!firstImeta.dim) return false;
    const [width, height] = firstImeta.dim.split('x').map(Number);
    if (!width || !height) return false;
    const isPortrait = width < height;

    return isPortrait;
}

function isLiveEvent(event: NDKEvent) {
    return event.kind === 30311 && event.tagValue('status') === 'live';
}