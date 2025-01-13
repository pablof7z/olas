import NDK, { Hexpubkey, NDKEvent, NDKEventId, NDKFilter, NDKKind, NDKSubscription, NDKSubscriptionCacheUsage, useFollows, useMuteList, useNDK, wrapEvent } from "@nostr-dev-kit/ndk-mobile";
import { matchFilters, VerifiedEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { blacklistPubkeys } from "@/utils/const";

/**
 * An entry in the feed. It ultimately resolves to an event,
 * but it includes reposts and the effective timestamp to use for
 * sorting.
 */
export type FeedEntry = {
    id: string;
    event?: NDKEvent;
    reposts: NDKEvent[];
    timestamp: number;

    /**
     * Used to track when we see an event deletion but we haven't
     * seen the deleted event yet -- we keep the pubkey of the
     * event doing the deletion to check it's the same as the author
     * of the event.
     */
    deletedBy?: Hexpubkey[];

    /**
     * Whether the entry has been deleted.
     */
    deleted?: boolean;
}

/**
 * Handles creating a feed that accounts for reposts, mutes
 * @param filters 
 * @param key Key by which to redo the subscription
 * @param subId 
 * @returns 
 */
export function useFeedEvents(
    filters: NDKFilter[] | undefined,
    key: string,
    subId = 'feed'
) {
    const { ndk } = useNDK();

    /**
     * This reference keeps all the events that have been received
     * and that will be rendered.
     */
    const feedEntriesRef = useRef(new Map<NDKEventId, FeedEntry>());
    const muteList = useMuteList();
    const follows = useFollows();

    /**
     * Tracks the event Ids we have already processed
     */
    const addedEventIds = useRef(new Set());

    const subscription = useRef<NDKSubscription | undefined>(undefined);
    const eosed = useRef(false);

    /**
     * Entries are the feed entries that the caller will see.
     */
    const [entries, setEntries] = useState<FeedEntry[]>([]);

    /**
     * newEntries are feed entries that arrived later than the feed
     * was rendered; they shouldn't be rendered but rather an indicator
     * shown that there are newer items to be displayed.
     */
    const [newEntries, setNewEntries] = useState<FeedEntry[]>([]);

    const effectiveBlackList = useMemo(() => {
        let list = new Set(blacklistPubkeys);

        if (muteList) muteList.forEach(p => list.add(p))
        if (follows) for (const pk of follows) list.delete(pk);
        return list;
    }, [muteList?.size, follows?.length])

    useEffect(() => {
        // remove muted and blacklisted pubkeys
        for (const [id, event] of feedEntriesRef.current.entries()) {
            if (!event.event) continue;
            const {pubkey} = event.event;

            if (effectiveBlackList.has(pubkey)) {
                feedEntriesRef.current.delete(id);
            }
        }

        updateEntries('skip list changed');
    }, [effectiveBlackList.size]);

    const discardMutedPubkeys = useCallback((entry: FeedEntry) => !effectiveBlackList.has(entry.event?.pubkey), [effectiveBlackList.size]);

    /**
     * This modifies entries in a way that the user of the hook will receive the
     * update in the feed of entries to render
     */
    const updateEntries = useCallback((reason: string) => {
        console.log('updating entries, we start with', entries.length, { reason });
        const newEntries = Array.from(feedEntriesRef.current.values())
            .filter((entry) => !!entry.event)
            .filter(discardMutedPubkeys)
            .sort((a, b) => b.timestamp - a.timestamp);

        setEntries(newEntries);
        if (newEntries.length > 0) setNewEntries([]);
        
        // console.log('updated entries, finished with', newEntries.length)
    }, [setEntries, newEntries, setNewEntries, discardMutedPubkeys]);

    const addEntry = useCallback((id: string, cb: (currentEntry: FeedEntry) => FeedEntry) => {
        let entry: FeedEntry = feedEntriesRef.current.get(id);
        if (!entry) entry = { id, reposts: [], timestamp: -1 };
        const ret = cb(entry);
        if (!!ret) {
            ret.timestamp = ret.event?.created_at ?? -1;
            feedEntriesRef.current.set(id, ret)
        }
        return entry;
    }, []);

    const handleContentEvent = useCallback((eventId: string, event: NDKEvent) => {
        const entry = addEntry(eventId, (entry: FeedEntry) => {
            const wrappedEvent = wrapEvent(event);
            const ret = { ...entry, event: wrappedEvent };
            ret.timestamp = event.created_at;
            return ret;
        });

        // if we have already EOSEd, we add to newEntries too
        if (eosed.current) {
            setNewEntries([ entry, ...newEntries ])
        }
    }, [setNewEntries, newEntries]);

    /**
     * Adds the repost to the right feed item, whether the item has been
     * processed yet or not.
     */
    const handleRepost = useCallback((event: NDKEvent) => {
        const repostedId = event.tagValue("e");
        if (!repostedId) return;

        addEntry(repostedId, (entry: FeedEntry) => {
            entry.reposts.push(event);
        
            if (!entry.event) {
                try {
                    const payload = JSON.parse(event.content)
                    entry = {
                        id: payload.id,
                        event: new NDKEvent(ndk, payload),
                        reposts: [event],
                        timestamp: event.created_at
                    }
                } catch {
                    entry = undefined;
                }
            }

            return entry;
        });
    }, []);

    const handleBookmark = useCallback((event: NDKEvent) => {
        const bookmarkedId = event.tagValue("e");
        if (!bookmarkedId) return;

        addEntry(bookmarkedId, (entry: FeedEntry) => {
            if (!entry || entry.timestamp < event.created_at) {
                entry ??= { id: bookmarkedId, reposts: [], timestamp: -1 };
                entry.timestamp = event.created_at;
            }
            return entry;
        });
    }, []);

    const handleDeletion = useCallback((event: NDKEvent) => {
        for (const deletedId of event.getMatchingTags("e")) {
            const entry = feedEntriesRef.current.get(deletedId[0]);
            if (entry?.event) {
                // check if the pubkey matches
                if (entry.event.pubkey === event.pubkey) {
                    entry.deleted = true;
                }
            } else {
                // we don't have the event, let's just record the deletion
                addEntry(deletedId[0], (entry) => ({ ...entry, deletedBy: [...(entry.deletedBy||[]), event.pubkey ] }));
            }
        }
    }, []);

    const handleEvent = useCallback((event: NDKEvent) => {
        const eventId = event.tagId();
        if (addedEventIds.current.has(eventId)) return;
        addedEventIds.current.add(eventId);

        switch (event.kind) {
            case NDKKind.VerticalVideo:
            case NDKKind.HorizontalVideo:
            case NDKKind.Image: return handleContentEvent(eventId, event);
            case NDKKind.GenericRepost: return handleRepost(event);
            case 3006: return handleBookmark(event);
            case NDKKind.EventDeletion: return handleDeletion(event);
        }
    }, []);

    const handleEose = useCallback(() => {
        eosed.current = true;
        updateEntries('eose');
    }, [])

    const filterExistingEvents = useCallback(() => {
        for (const [id, feedEntry] of feedEntriesRef.current) {
            if (!feedEntry.event) continue;
            const keep = feedEntry.event && matchFilters(filters, feedEntry.event.rawEvent() as VerifiedEvent)
            if (!keep) {
                // console.log('filtering out', id)
                feedEntriesRef.current.delete(id)
            }
        }
    }, [key]);
    
    useEffect(() => {
        if (!ndk) return;
        if (!filters) return;

        if (subscription.current) {
            subscription.current.stop();
            subscription.current = null;
            eosed.current = false;
            addedEventIds.current.clear();

            filterExistingEvents()
            updateEntries('finalizing subscription, will update entries');
        }
        
        console.log('subscribe feed filters', JSON.stringify(filters));
        
        const sub = ndk.subscribe(filters, { groupable: false, skipVerification: true, subId }, undefined, false);

        sub.on("event", handleEvent);
        sub.on('cacheEose', handleEose);
        sub.once('eose', handleEose);

        sub.start();
        subscription.current = sub;

        return () => {
            // console.log('unsubscribing', JSON.stringify(filters).substring(0, 400));
            sub.stop();
        }
    }, [ndk, key])

    return {
        entries,
        newEntries,
        
        /**
         * When new events arrive after EOSE, they will be collected in the newEntries, this is
         * so that the feed doesn't jump around and instead we can show a "new events received".
         * 
         * The application should call ingestNewEntries when it's ready to render them.
         */
        updateEntries
    };
}

/**
 * This hook receives a list of events that.
 * 
 * We want to monitor for events that are tagging the events in the active slices.
 * 
 * We may keep one or two subscriptions that will be fetching data for the items.
 * 
 * As the user is scrolling down, when they are close to reaching the end of the current slice's index a new
 * subscription is created with the next slice.
 * If the user keeps scrolling down, after a threshold, the previous subscription is closed
 * 
 * @param events: Events to monitor
 * @param closeThreshold Distance to the previous slice at which that subscription is closed.
 * @param sliceSize Sice of the slice
 */
type Slice = {
    start: number;
    end: number;
    sub?: NDKSubscription;
    removeTimeout?: NodeJS.Timeout;
}
export function useFeedMonitor(
    events: NDKEvent[],
    sliceSize = 10
) {
    const { ndk } = useNDK();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const activeSlices = useRef<Slice[]>([]);

    const sliceToFilter = (slice: Slice): NDKFilter => {
        const filters: Record<string, string[]> = {};
        events.slice(slice.start, slice.end)
            .flatMap(event => Object.entries(event.filter()))
            .forEach(([key, value]) => {
                filters[key] ??= [];
                filters[key].push(value[0]);
            });
        return filters;
    }

    const addSlice = (slice: Slice) => {
        const filters = sliceToFilter(slice);
        slice.sub = ndk.subscribe(
            filters
        , {
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, closeOnEose: false, groupable: false, skipVerification: true, subId: `feed-${slice.start}2${slice.end}` }, undefined, true);
        activeSlices.current.push(slice);
    }

    const removeSlice = (slice: Slice) => {
        slice.removeTimeout = setTimeout(() => {
            // console.log('removing slice that starts in', slice.start);
            slice.sub.stop();
            activeSlices.current = activeSlices.current.filter(s => s.start !== slice.start);
        }, 500)
    }

    useEffect(() => {
        try {
        if (activeIndex === null) return;

        const neededSlices = calcNeededSlices(activeIndex, sliceSize, events.length)

        // go through the slices we have and determine what we should remove
        for (const activeSlice of activeSlices.current) {
            const keep = neededSlices.find(slice => slice.start === activeSlice.start);

            if (!keep) {
                if (!activeSlice.removeTimeout) removeSlice(activeSlice);
            } else if (activeSlice.removeTimeout) {
                clearTimeout(activeSlice.removeTimeout)
                activeSlice.removeTimeout = null;
            }
        }

        // go through the slices we want and determine what we need to add
        for (const neededSlice of neededSlices) {
            const exists = activeSlices.current.find(slice => slice.start === neededSlice.start);

            if (!exists) addSlice(neededSlice)
        }

        // console.log(`Active Index: ${activeIndex}`);
        // for (const slice of activeSlices.current) {
        //     console.log(`\tfrom ${slice.start} to ${slice.end}`)
        // }
    } catch (e) {
        console.error(e)
    }

        // return () => {
        //     console.log('unmount')
        //     for (const activeSlice of activeSlices.current) {
        //         if (!activeSlice.removeTimeout) removeSlice(activeSlice);
        //     }
        // };
    }, [activeIndex]);
    
    return {
        setActiveIndex
    };
}

function calcNeededSlices(
    currentIndex,
    sliceSize,
    totalLength,
) {
    const currentSlice: Slice = {
        start: currentIndex - (currentIndex % sliceSize),
        end: (currentIndex - (currentIndex % sliceSize)) + sliceSize
    };
    const prevSlice: Slice = {
        start: currentSlice.start - sliceSize,
        end: currentSlice.end - sliceSize,
    }
    const nextSlice: Slice = {
        start: currentSlice.start + sliceSize,
        end: currentSlice.end + sliceSize,
    }

    const mapSlices = (slice: Slice): Slice | null => {
        // if we are finishing before 0 then this is an invalid slice
        if (slice.end <= 0) return null;

        // if we are starting after the end this is an invalid slice
        if (slice.start > totalLength) return null;

        if (slice.start < 0) slice.start = 0;
        if (slice.end > totalLength) slice.end = totalLength;

        return slice;
    }

    let slices = [ prevSlice, currentSlice, nextSlice ];
    // console.log('before', slices, { currentIndex, sliceSize, totalLength})
    slices = slices
        .map(mapSlices)
        .filter(slice => slice !== null)
    
    // console.log('calculated slices');
    // slices.forEach(s => console.log(`from ${s.start} to ${s.end}`))
    return slices;
}