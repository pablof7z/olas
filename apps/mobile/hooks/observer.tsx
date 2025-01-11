import { NDKEvent, NDKFilter, NDKKind, NDKSubscription, NDKSubscriptionCacheUsage, useNDK } from "@nostr-dev-kit/ndk-mobile";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs a filter in the background without ever talking to relays.
 * @param filters Filters to run.
 * @param key The key by which to re-run the filters. If it's false, don't run anything.
 * @returns 
 */
export function useObserver(
    filters: NDKFilter[],
    key: string | false
) {
    const { ndk } = useNDK();
    const sub = useRef<NDKSubscription | null>(null);
    const [events, setEvents] = useState<NDKEvent[]>([]);
    const buffer = useRef<NDKEvent[]>([]);
    const bufferTimeout = useRef<NodeJS.Timeout | null>(null);
    const addedEventIds = new Set();

    const stopFilters = useCallback(() => {
        sub.current?.stop();
        sub.current = null;
        buffer.current = [];
        if (bufferTimeout.current) clearTimeout(bufferTimeout.current);
        bufferTimeout.current = null;
        addedEventIds.clear();
        setEvents([]);
    }, [ setEvents ]);

    useEffect(() => {
        if (!ndk) return;
        
        let isValid = true;

        if (sub.current) stopFilters();

        if (key === false) return;

        sub.current = ndk.subscribe(filters, {
            skipVerification: true,
            closeOnEose: true,
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
            groupable: false,
            subId: 'observer',
        }, undefined, false);
        sub.current.on('event', (event) => {
            if (!isValid) return;

            const tagId = event.tagId()
            if (addedEventIds.has(tagId)) {
                console.trace('we already have event' + event.kind, JSON.stringify(filters))
                return;
            }
            addedEventIds.add(tagId);
            buffer.current.push(event);
            if (!bufferTimeout.current) {
                bufferTimeout.current = setTimeout(() => {
                    setEvents(prev => [...prev, ...buffer.current]);
                    buffer.current = [];
                    bufferTimeout.current = null;
                }, 50);
            }
        });
        sub.current.start();

        return () => {
            isValid = false;
            stopFilters();
        };
    }, [ndk, key]);

    return events;
}