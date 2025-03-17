import { NDKEvent, NDKFilter, NDKSubscription, NDKSubscriptionCacheUsage, NDKSubscriptionOptions, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useObserver<T extends NDKEvent>(
    filters: NDKFilter[] | false,
    opts: NDKSubscriptionOptions = {},
    dependencies: any[] = []
): T[] {
    const { ndk } = useNDK();
    const sub = useRef<NDKSubscription | null>(null);
    const [events, setEvents] = useState<NDKEvent[]>([]);
    const buffer = useRef<NDKEvent[]>([]);
    const bufferTimeout = useRef<NodeJS.Timeout | null>(null);
    const addedEventIds = useRef(new Set<string>());

    // Push a dependency so the effect re-runs if filters change.
    dependencies.push(!!filters);

    const stopFilters = useCallback(() => {
        if (sub.current) sub.current.stop();
        sub.current = null;
        buffer.current = [];
        if (bufferTimeout.current) {
            clearTimeout(bufferTimeout.current);
            bufferTimeout.current = null;
        }
        addedEventIds.current.clear();
        setEvents([]);
    }, [setEvents]);

    useEffect(() => {
        if (!ndk || !filters || filters.length === 0) return;

        let isValid = true;
        if (sub.current) stopFilters();

        // Helper to process each event with deduplication and buffering.
        const processEvent = (event: NDKEvent) => {
            if (!isValid) return;
            const tagId = event.tagId();
            if (addedEventIds.current.has(tagId)) return;
            addedEventIds.current.add(tagId);
            buffer.current.push(event);
            if (!bufferTimeout.current) {
                bufferTimeout.current = setTimeout(() => {
                    setEvents((prev) => [...prev, ...buffer.current]);
                    buffer.current = [];
                    bufferTimeout.current = null;
                }, 50);
            }
        };

        // Create the subscription.
        sub.current = ndk.subscribe(
            filters,
            {
                skipVerification: true,
                closeOnEose: true,
                cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
                groupable: false,
                subId: 'observer',
                wrap: true,
                ...opts,
            },
            undefined,
            false
        );

        // Process asynchronous events.
        sub.current.on('event', (event) => {
            if (!isValid) return;
            processEvent(event);
        });

        // Synchronously get events from cache.
        const syncEvents = sub.current.start(false);
        if (syncEvents) {
            for (const event of syncEvents) processEvent(event);
        }

        // Flush synchronous events immediately.
        if (buffer.current.length > 0) {
            if (bufferTimeout.current) {
                clearTimeout(bufferTimeout.current);
                bufferTimeout.current = null;
            }
            setEvents(buffer.current);
            buffer.current = [];
        }

        return () => {
            isValid = false;
            stopFilters();
        };
    }, [ndk, ...dependencies]);

    return events as T[];
}
