import { useEffect, useMemo, useRef, useState } from 'react';
import { useNDK, useSubscribe } from '@/ndk-expo';
import { NDKEvent, NDKSubscriptionCacheUsage, getRootEventId, NDKEventId } from '@nostr-dev-kit/ndk';

interface Thread {
    id: string;
    rootEventId: string;
    events: NDKEvent[];
}

export const useThreads = () => {
    const processedRootEventIds = useRef<Set<string>>(new Set());
    const { ndk } = useNDK();
    const [threads, setThreads] = useState<Thread[]>([]);

    const filter = useMemo(() => [{ kinds: [1], '#p': ['fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52'], limit: 50 }], []);
    const opts = useMemo(
        () => ({
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
        }),
        []
    );
    const { events } = useSubscribe({ filters: filter, opts });

    const rootEventIdOrEventId = (event: NDKEvent) => getRootEventId(event) ?? event.id;

    const rootEventIds = useMemo(() => new Set(events.map(rootEventIdOrEventId)), [events]);

    useEffect(() => {
        if (!ndk) return;

        for (const rootEventId of rootEventIds) {
            if (processedRootEventIds.current.has(rootEventId)) continue;

            processedRootEventIds.current.add(rootEventId);
            const sub = ndk.subscribe(
                [
                    { kinds: [1], ids: [rootEventId] },
                    { kinds: [1], '#e': [rootEventId] },
                ],
                { closeOnEose: false },
                undefined,
                false
            );
            sub.on('event', handleEvent(rootEventId));
            sub.on('eose', () => {
                console.log('eose', rootEventId);
            });
            sub.start();
        }
    }, [ndk, rootEventIds]);

    const handleEvent = (rootEventId: NDKEventId) => (event: NDKEvent) => {
        setThreads((prev) => {
            const thread = prev.find((t) => t.rootEventId === rootEventId);
            if (thread) {
                thread.events.push(event);
                return [...prev];
            } else {
                return [...prev, { id: rootEventId, rootEventId, events: [event] }];
            }
        });
    };

    return threads;
};
