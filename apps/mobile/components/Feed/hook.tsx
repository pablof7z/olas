import { usePubkeyBlacklist } from "@/hooks/blacklist";
import { usePaymentStore } from "@/stores/payments";
import { useReactionsStore } from "@/stores/reactions";
import NDK, { Hexpubkey, NDKEvent, NDKEventId, NDKFilter, NDKKind, NDKRelaySet, NDKSubscription, NDKSubscriptionCacheUsage, useMuteFilter, useNDK, wrapEvent, useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { matchFilters, VerifiedEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * This threshold determines how old a new entry can be to be considered
 * to be put at the top of the stack AFTER we have EOSEd.
 * 
 * This is to prevent us from showing old events at the top of the feed
 * after an EOSE when new events are received from other subscriptions.
 */
const NEW_ENTRY_THRESHOLD = 60 * 5;

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
 * @param opts.subId The subscription ID to use for this feed
 * @param dependencies Dependencies to re-run the subscription
 * @returns 
 */
export function useFeedEvents(
    filters: NDKFilter[] | undefined,
    { subId, filterFn, relayUrls }: {
        subId?: string,
        filterFn?: (feedEntry: FeedEntry, index: number) => boolean,
        relayUrls?: string[]
    } = {},
    dependencies = []
) {
    subId ??= 'feed';
    
    const { ndk } = useNDK();

    /**
     * The lifecycle of this hook is:
     * 
     * - events are received -> handleEvent
     * - the entry is added to allEntriesRef
     * - 
     */


    const allEntriesRef = useRef(new Map<NDKEventId, FeedEntry>());
    
    /**
     * This reference keeps all the events that have been received
     * but not yet rendered.
     */
    const newEntriesRef = useRef(new Set<NDKEventId>());

    /**
     * All event ids that are currently rendered.
     */
    const renderedEntryIdsRef = useRef(new Set<NDKEventId>());

    const renderedIdsRef = useRef<Set<NDKEventId>>(new Set());
    
    /**
     * Tracks the event Ids we have already processed, note that this includes
     * IDs that are not feed entries (like reposts), that's why we need
     * to keep track of them separately.
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

    const pubkeyBlacklist = usePubkeyBlacklist();
    const isMutedEvent = useMuteFilter();

    const entriesFromIds = (ids: Set<NDKEventId>) => Array.from(ids.values())
        .map(id => allEntriesRef.current.get(id))
        .filter(entry => !!entry);

    /**
     * This modifies entries in a way that the user of the hook will receive the
     * update in the feed of entries to render
     */
    const updateEntries = useCallback((reason: string) => {
        const time = Date.now() - subscriptionStartTime.current;
        // console.log(`[${Date.now() - timeZero}ms]`, `[FEED HOOK ${time}ms] updating entries, we start with`, renderedEntryIdsRef.current.size, 'we have', newEntriesRef.current.size, 'new entries to consider', { reason });

        const newSliceIds = Array.from(newEntriesRef.current.values());
        let newSlice = entriesFromIds(new Set(newSliceIds));

        if (filterFn) newSlice = newSlice.filter(filterFn);

        // we only sort the slice, so that we don't mix events we just happened to see after
        // newer events -- this prevents us from adding new entries below posts we have already
        // rendered
        if (newSlice.length > 0) {
            // console.log(`[FEED HOOK] we have a new slice of ${newSlice.length} entries, rendered entries are ${renderedEntryIdsRef.current.size}`)

            let renderedEntries = entriesFromIds(renderedEntryIdsRef.current);

            // update the renderedIdsRef
            newSlice.forEach(entry => renderedIdsRef.current.add(entry.id));

            // if we have eosed, sort the new slice and add it to the beginning of the entries
            if (eosed.current) {
                newSlice = newSlice.sort((a, b) => b.timestamp - a.timestamp);
                renderedEntries = [...newSlice, ...renderedEntries];
            } else {
                // otherwise, merge with the currently rendered entries and sort everything
                renderedEntries = [...newSlice, ...renderedEntries]
                    .sort((a, b) => b.timestamp - a.timestamp);
            }

            // renderedEntries.forEach(entry => console.log('rendered entry', entry.id, entry.timestamp))

            // update the renderedIdsRef
            renderedEntryIdsRef.current = new Set(renderedEntries.map(entry => entry.id));
            setEntries(renderedEntries);
        // } else {
        //     console.log('no new entries to add, the slice is empty', newEntriesRef.current.size)
        }

        setNewEntries([]);
        newEntriesRef.current.clear();
    }, [isMutedEvent, filterFn]);

    // const shouldIncludeRenderedEntry = useCallback((entry: FeedEntry) => {
    //     if (!entry.event) return false;
    //     if (isMutedEvent(entry.event) || pubkeyBlacklist.has(entry.event?.pubkey)) return false;
    //     if (filterFn && !filterFn(entry, 0)) return false;
    //     return true;
    // }, [isMutedEvent, pubkeyBlacklist, filterFn]);

    useEffect(() => {
        // check if any of the entries or new entries are muted or blacklisted, if anything changes
        // set the value
        let changed = false;

        for (const entry of entriesFromIds(renderedEntryIdsRef.current)) {
            if (isMutedEvent(entry.event) || pubkeyBlacklist.has(entry.event?.pubkey)) {
                console.log('removing entry', entry.id, entry.event?.pubkey)
                changed = true;
                // remove the entry
                renderedEntryIdsRef.current.delete(entry.id);
                allEntriesRef.current.delete(entry.id);
            }
        }

        if (changed) setEntries(entriesFromIds(renderedEntryIdsRef.current));

        // same thing for new entries
        changed = false;
        for (const entry of entriesFromIds(newEntriesRef.current)) {
            if (isMutedEvent(entry.event) || pubkeyBlacklist.has(entry.event?.pubkey)) {
                // console.log('removing new entry', entry.id, entry.event?.pubkey)
                changed = true;
                // remove the entry
                newEntriesRef.current.delete(entry.id);
            }
        }

        if (changed) setNewEntries(entriesFromIds(newEntriesRef.current));
    }, [isMutedEvent, pubkeyBlacklist])

    const highestTimestamp = useRef(-1);

    /**
     * This is invoked when something for an entry has changed.
     */
    const updateEntry = useCallback((id: string, cb: (currentEntry: FeedEntry) => FeedEntry) => {
        let entry: FeedEntry = allEntriesRef.current.get(id);
        if (!entry) entry = { id, reposts: [], timestamp: -1 };
        const ret = cb(entry);
        if (!!ret) {
            // check this isn't muted or blacklisted
            if (isMutedEvent(ret.event) || pubkeyBlacklist.has(ret.event?.pubkey)) return;

            if (!ret.timestamp) ret.timestamp = ret.event?.created_at ?? -1;

            // always add it to the allEntriesRef
            allEntriesRef.current.set(id, ret)

            // if we are not already rendering this event and it passes the user filter
            // add it to the new entries ref
            const isNotAlreadyRendered = !renderedEntryIdsRef.current.has(id);
            const isNotAlreadyMarkedAsNew = !newEntriesRef.current.has(id);
            const passesFilters = filterFn ? filterFn(ret, 0) : true;

            const isEosed = eosed.current;

            const isNotTooOld = !(isEosed && ret.timestamp < (Date.now() / 1000) - NEW_ENTRY_THRESHOLD);

            if (
                isNotAlreadyRendered &&
                isNotAlreadyMarkedAsNew &&
                passesFilters &&
                isNotTooOld
            ) {
                newEntriesRef.current.add(id);

                // if we have already eosed, we update the new entries state
                if (isEosed) {
                    console.log('we received a new entry after eose so we are updating the new entries state', newEntriesRef.current.size)
                    setNewEntries(entriesFromIds(newEntriesRef.current));
                }
            }

            const isNewerTimestamp = ret.timestamp > highestTimestamp.current;

            // we want to update the entries when we haven't EOSEd and the timestamp is newer
            // than the highest timestamp we have seen so far
            if (!isEosed && isNewerTimestamp) {
                highestTimestamp.current = ret.timestamp;
                updateEntries('new entry ');
            }
        }
        return ret;
    }, [updateEntries, setNewEntries]);

    const handleContentEvent = useCallback((eventId: string, event: NDKEvent) => {
        updateEntry(eventId, (entry: FeedEntry) => {
            const wrappedEvent = wrapEvent(event);
            return { ...entry, event: wrappedEvent, timestamp: event.created_at };
        });
    }, [setNewEntries, updateEntry]);

    /**
     * Adds the repost to the right feed item, whether the item has been
     * processed yet or not.
     */
    const handleRepost = useCallback((event: NDKEvent) => {
        const repostedId = event.tagValue("e");
        if (!repostedId) return;

        updateEntry(repostedId, (entry: FeedEntry) => {
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

            if (!entry.timestamp || event.created_at > entry.timestamp) {
                entry.timestamp = event.created_at;
            }

            return entry;
        });
    }, []);

    const handleBookmark = useCallback((event: NDKEvent) => {
        const bookmarkedId = event.tagValue("e");
        if (!bookmarkedId) return;

        updateEntry(bookmarkedId, (entry: FeedEntry) => {
            if (!entry || entry.timestamp < event.created_at) {
                entry ??= { id: bookmarkedId, reposts: [], timestamp: -1 };
                entry.timestamp = event.created_at;
            }
            return entry;
        });
    }, [updateEntry]);

    const handleDeletion = useCallback((event: NDKEvent) => {
        for (const deletedId of event.getMatchingTags("e")) {
            const entry = allEntriesRef.current.get(deletedId[0]);
            if (entry?.event) {
                // check if the pubkey matches
                if (entry.event.pubkey === event.pubkey) {
                    entry.deleted = true;
                }
            } else {
                // we don't have the event, let's just record the deletion
                updateEntry(deletedId[0], (entry) => ({ ...entry, deletedBy: [...(entry.deletedBy||[]), event.pubkey ] }));
            }
        }
    }, [updateEntry]);

    const handleEvent = useCallback((event: NDKEvent) => {
        const eventId = event.tagId();
        if (addedEventIds.current.has(eventId)) return;
        addedEventIds.current.add(eventId);

        switch (event.kind) {
            case NDKKind.VerticalVideo:
            case NDKKind.HorizontalVideo:
            case 30018:
            case 30402:
            case NDKKind.Text:
            case NDKKind.Image: return handleContentEvent(eventId, event);
            case NDKKind.GenericRepost: return handleRepost(event);
            case 3006: return handleBookmark(event);
            case NDKKind.EventDeletion: return handleDeletion(event);
        }
    }, [handleContentEvent, handleRepost, handleBookmark, handleDeletion]);

    const handleEose = useCallback(() => {
        updateEntries('eose');
        eosed.current = true;
    }, [updateEntries])

    /**
     * We want to flush the buffer the moment the cache finishes loading, particularly for when
     * we are not connected to relays and there won't be an EOSE coming any time soon.
     */
    const handleCacheEose = useCallback(() => {
        updateEntries('cache-eose');
    }, [updateEntries]);

    const filterExistingEvents = useCallback(() => {
        let changed = false;

        const passesFilter = (entry: FeedEntry) => !filterFn || filterFn(entry, 0);

        const newRenderEntries = [];

        // Go through the currently-rendered entries and see if we need to change them
        for (const entry of entriesFromIds(renderedEntryIdsRef.current)) {
            const keep = entry.event && matchFilters(filters, entry.event.rawEvent() as VerifiedEvent)
            if (!keep || !passesFilter(entry)) {
                changed = true;
                renderedIdsRef.current.delete(entry.id);
            } else {
                newRenderEntries.push(entry);
            }
        }

        if (changed) {
            renderedEntryIdsRef.current = new Set(newRenderEntries.map(entry => entry.id));
            setEntries(newRenderEntries);
        }

        if (!changed) {
            for (const id of newEntriesRef.current) {
                const feedEntry = allEntriesRef.current.get(id);
                if (!feedEntry.event || addedEventIds.current.has(id)) continue;
                if (!passesFilter(feedEntry)) continue;

                const keep = feedEntry.event && matchFilters(filters, feedEntry.event.rawEvent() as VerifiedEvent)
                if (!keep || !passesFilter(feedEntry)) {
                    newEntriesRef.current.delete(id)
                    // addedEventIds.current.add(id);
                    changed = true;
                }
            }
        }

        if (changed) updateEntries('filtering out events');
    }, dependencies);

    const subscriptionStartTime = useRef(0);
    
    useEffect(() => {
        if (!ndk) return;
        if (!filters) return;

        subscriptionStartTime.current = Date.now();

        if (subscription.current) {
            subscription.current.stop();
            subscription.current = null;
            eosed.current = false;
            addedEventIds.current.clear();

            filterExistingEvents()
        }

        let relaySet: NDKRelaySet | undefined = undefined;
        if (relayUrls) {
            relaySet = NDKRelaySet.fromRelayUrls(relayUrls, ndk);
        }

        const sub = ndk.subscribe(filters, { groupable: false, skipVerification: true, subId, cacheUnconstrainFilter: [] }, relaySet, false);

        sub.on("event", handleEvent);
        sub.once('eose', handleEose);
        sub.once('cacheEose', handleCacheEose);

        sub.start();
        subscription.current = sub;

        return () => {
            sub.stop();
        }
    }, [ndk, ...dependencies])

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
    /** The event IDs in this slice */
    eventIds: string[];
    /** Original start index in the events array */
    startIndex: number;
    /** Original end index in the events array */
    endIndex: number;
    sub?: NDKSubscription;
    removeTimeout?: NodeJS.Timeout;
};

const sliceToFilter = (slice: Slice): NDKFilter[] => {
    return [{ '#e': slice.eventIds }];
};

function calcNeededSlices(
    currentIndex: number,
    sliceSize: number,
    events: NDKEvent[],
) {
    const slices: Slice[] = [];
    const totalLength = events.length;
    
    // Create slices around current position
    const ranges = [
        { // Previous slice
            start: Math.max(0, currentIndex - sliceSize),
            end: currentIndex
        },
        { // Next slice
            start: currentIndex,
            end: Math.min(totalLength, currentIndex + sliceSize)
        }
    ];

    ranges.forEach(({ start, end }) => {
        if (start >= end) return;
        
        const sliceEvents = events.slice(start, end);
        if (sliceEvents.length === 0) return;

        slices.push({
            eventIds: sliceEvents.map(e => e.id),
            startIndex: start,
            endIndex: end
        });
    });

    return slices;
}

export function useFeedMonitor(
    events: NDKEvent[],
    sliceSize = 5
) {
    const { ndk } = useNDK();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const activeIds = useRef<Set<string>>(new Set());
    const activeSlices = useRef<Slice[]>([]);
    const currentUser = useNDKCurrentUser();
    const addRelatedEvents = useReactionsStore(s => s.addEvents);
    const addPayments = usePaymentStore(s => s.addPayments);

    // useEffect(() => {
    //     if
    // }, [events[0]?.id, ])

    // const handleEvent = (event: NDKEvent) => {
    //     const id = event.tagId();
    //     const current = 
    //     eventsRef.current.set(id, event);
    // }

    const addSlice = (newSlice: Slice) => {
        if (newSlice.eventIds.length === 0) return;

        const idsToAdd = new Set(newSlice.eventIds);
        for (const id of idsToAdd) {
            if (activeIds.current.has(id)) idsToAdd.delete(id);
        }

        if (idsToAdd.size === 0) return;

        newSlice.eventIds = Array.from(idsToAdd);

        const filters = [{ '#e': newSlice.eventIds }];
        newSlice.sub = ndk.subscribe(filters, {
            closeOnEose: false,
            groupable: false,
            skipVerification: true,
            subId: `feedmonitor-${newSlice.startIndex}-${newSlice.endIndex}`
        }, undefined, {
            onEvent: (event) => {
                addRelatedEvents([event], currentUser?.pubkey)
                addPayments([event])
            },
            onEvents: (events) => {
                addRelatedEvents(events, currentUser?.pubkey);
                addPayments(events);
            }
        });
        activeSlices.current.push(newSlice);
        for (const id of newSlice.eventIds) {
            activeIds.current.add(id);
        }
    }

    const removeSlice = (slice: Slice) => {
        slice.removeTimeout = setTimeout(() => {
            slice.sub.stop();
            activeSlices.current = activeSlices.current.filter(s => s.eventIds[0] !== slice.eventIds[0]);
            for (const id of slice.eventIds) {
                activeIds.current.delete(id);
            }
        }, 500)
    }

    useEffect(() => {
        if (activeIndex === null) return;

        const neededSlices = calcNeededSlices(activeIndex, sliceSize, events)

        // go through the slices we have and determine what we should remove
        for (const activeSlice of activeSlices.current) {
            const keep = neededSlices.find(slice => slice.eventIds[0] === activeSlice.eventIds[0]);

            if (!keep) {
                if (!activeSlice.removeTimeout) removeSlice(activeSlice);
            } else if (activeSlice.removeTimeout) {
                clearTimeout(activeSlice.removeTimeout)
                activeSlice.removeTimeout = null;
            }
        }

        // go through the slices we want and determine what we need to add
        for (const neededSlice of neededSlices) {
            const exists = activeSlices.current.find(slice => slice.eventIds[0] === neededSlice.eventIds[0]);

            if (!exists) addSlice(neededSlice)
        }

        // // clean up active subs on unmount
        
    }, [activeIndex !== null ? events[activeIndex]?.id : null, events.length < sliceSize]);

    useEffect(() => {
        return () => {
            activeSlices.current.forEach(slice => slice.sub.stop());
        }
    }, [])
    
    return {
        setActiveIndex
    };
}