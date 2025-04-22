import { useMuteFilter } from "@nostr-dev-kit/ndk-hooks";
import {
    type Hexpubkey,
    NDKEvent,
    type NDKEventId,
    type NDKFilter,
    NDKKind, type NDKSubscription,
    useNDK,
    useNDKCurrentPubkey
} from "@nostr-dev-kit/ndk-mobile";
import { matchFilters } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePaymentStore } from "@/stores/payments";
import { useReactionsStore } from "@/stores/reactions";

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
};

const timeZero = Date.now();

/**
 * Handles creating a feed that accounts for reposts, mutes
 * @param filters
 * @param opts.subId The subscription ID to use for this feed
 * @param dependencies Dependencies to re-run the subscription
 * @returns
 */
export function useFeedEvents(
    filters: NDKFilter[] | undefined,
    {
        subId,
        filterFn,
        relayUrls,
    }: {
        subId?: string;
        filterFn?: (feedEntry: FeedEntry, index: number) => boolean;
        relayUrls?: string[];
    } = {},
    dependencies: any[] = [],
) {
    subId ??= "feed";

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

    const isMutedEvent = useMuteFilter(); // Instantiate the hook

    const freezeState = useRef(false);

    const entriesFromIds = (ids: Set<NDKEventId>) =>
        Array.from(ids.values())
            .map((id) => allEntriesRef.current.get(id))
            .filter((entry): entry is FeedEntry => !!entry); // Type guard

    /**
     * This modifies entries in a way that the user of the hook will receive the
     * update in the feed of entries to render
     */
    const updateEntries = useCallback(
        (reason: string) => {
            const time = Date.now();
            if (freezeState.current) return;
            console.log(`[${Date.now() - timeZero}ms]`, `[FEED HOOK ${time}ms] updating entries, we start with`, renderedEntryIdsRef.current.size, 'we have', newEntriesRef.current.size, 'new entries to consider', { reason });

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
                newSlice.forEach((entry) => renderedIdsRef.current.add(entry.id));

                // if we have eosed, sort the new slice and add it to the beginning of the entries
                if (eosed.current) {
                    newSlice = newSlice.sort((a, b) => b.timestamp - a.timestamp);
                    renderedEntries = [...newSlice, ...renderedEntries];
                } else {
                    // otherwise, merge with the currently rendered entries and sort everything
                    renderedEntries = [...newSlice, ...renderedEntries].sort((a, b) => b.timestamp - a.timestamp);
                }

                // renderedEntries.forEach(entry => console.log('rendered entry', entry.id, entry.timestamp))

                // update the renderedIdsRef
                renderedEntryIdsRef.current = new Set(renderedEntries.map((entry) => entry.id));
                setEntries(renderedEntries);
                // } else {
                //     console.log('no new entries to add, the slice is empty', newEntriesRef.current.size)
            }

            setNewEntries([]);
            newEntriesRef.current.clear();
        },
        [isMutedEvent, filterFn],
    );

    useEffect(() => {
        // check if any of the entries or new entries are muted or blacklisted, if anything changes
        // set the value
        let changed = false;

        for (const entry of entriesFromIds(renderedEntryIdsRef.current)) {
            if (entry?.event && (isMutedEvent(entry.event))) {
                changed = true;
                // remove the entry
                renderedEntryIdsRef.current.delete(entry.id);
                allEntriesRef.current.delete(entry.id);
            }
        }

        if (changed) {
            setEntries(entriesFromIds(renderedEntryIdsRef.current));
        }

        // same thing for new entries
        changed = false;
        for (const entry of entriesFromIds(newEntriesRef.current)) {
            if (entry?.event && (isMutedEvent(entry.event))) {
                // console.log('removing new entry', entry.id, entry.event?.pubkey)
                changed = true;
                // remove the entry
                newEntriesRef.current.delete(entry.id);
            }
        }

        if (changed) setNewEntries(entriesFromIds(newEntriesRef.current));
    }, [isMutedEvent]);

    const highestTimestamp = useRef(-1);

    /**
     * This is invoked when something for an entry has changed.
     *
     * @param id The id of the entry to update
     * @param cb A callback that receives the current entry and a boolean indicating if the state should be frozen
     * @param freezeState Whether the state should not be updated -- this is useful when adding events in bulk
     */
    const updateEntry = useCallback(
        (id: string, cb: (currentEntry: FeedEntry | undefined) => FeedEntry | undefined) => {
            const entry: FeedEntry | undefined = allEntriesRef.current.get(id);
            // Provide default if entry is undefined before calling cb
            const ret = cb(entry ?? { id, reposts: [], timestamp: -1 });
            if (ret) {
                // check this isn't muted or blacklisted
                if (ret.event && (isMutedEvent(ret.event))) return;

                if (!ret.timestamp) ret.timestamp = ret.event?.created_at ?? -1;

                // always add it to the allEntriesRef
                allEntriesRef.current.set(id, ret);

                // if we are not already rendering this event and it passes the user filter
                // add it to the new entries ref
                const isNotAlreadyRendered = !renderedEntryIdsRef.current.has(id);
                const isNotAlreadyMarkedAsNew = !newEntriesRef.current.has(id);
                const passesFilters = filterFn ? filterFn(ret, 0) : true;

                if (!passesFilters) {
                    return;
                }

                const isEosed = eosed.current;

                const isNotTooOld = !(isEosed && ret.timestamp < Date.now() / 1000 - NEW_ENTRY_THRESHOLD);

                if (isNotAlreadyRendered && isNotAlreadyMarkedAsNew && isNotTooOld) {
                    newEntriesRef.current.add(id);

                    // if we have already eosed, we update the new entries state
                    if (isEosed) {
                        setNewEntries(entriesFromIds(newEntriesRef.current));
                    }
                }

                const isNewerTimestamp = ret.timestamp > highestTimestamp.current;

                // we want to update the entries when we haven't EOSEd and the timestamp is newer
                // than the highest timestamp we have seen so far
                if (!isEosed && isNewerTimestamp) {
                    highestTimestamp.current = ret.timestamp;
                    updateEntries("new entry ");
                }
            }
            return ret;
        },
        [updateEntries, setNewEntries, filterFn], // Added dependencies
    );

    const handleContentEvent = useCallback(
        (eventId: string, event: NDKEvent) => {
            updateEntry(eventId, (entry) => {
                // Ensure entry is defined before spreading, provide default if not
                const baseEntry = entry ?? { id: eventId, reposts: [], timestamp: -1 };
                return { ...baseEntry, event, timestamp: event.created_at };
            });
        },
        [updateEntry],
    );

    /**
     * Adds the repost to the right feed item, whether the item has been
     * processed yet or not.
     */
    const handleRepost = useCallback(
        (event: NDKEvent) => {
            const repostedId = event.tagValue("e");
            if (!repostedId) return;

            updateEntry(repostedId, (entry) => {
                // Ensure entry is defined before modifying, provide default if not
                let currentEntry = entry ?? { id: repostedId, reposts: [], timestamp: -1 };
                currentEntry.reposts.push(event);

                if (!currentEntry.event) {
                    try {
                        if (!ndk) return currentEntry; // Need NDK instance
                        const payload = JSON.parse(event.content);
                        // Create a new entry object instead of modifying the parameter directly
                        currentEntry = {
                            id: payload.id,
                            event: new NDKEvent(ndk, payload),
                            reposts: [event],
                            timestamp: event.created_at,
                        };
                    } catch {
                        // If parsing fails, return the entry as it was before trying to parse
                        // Or potentially return undefined if the entry should be discarded
                        return currentEntry; // Keep existing state on error
                    }
                }

                // Use the potentially updated currentEntry
                if (!currentEntry.timestamp || event.created_at > currentEntry.timestamp) {
                    currentEntry.timestamp = event.created_at;
                }

                return currentEntry;
            });
        },
        [ndk, updateEntry],
    ); // Added ndk dependency

    const handleBookmark = useCallback(
        (event: NDKEvent) => {
            const bookmarkedId = event.tagValue("e");
            if (!bookmarkedId) return;

            updateEntry(bookmarkedId, (entry) => {
                let currentEntry = entry ?? { id: bookmarkedId, reposts: [], timestamp: -1 };
                if (!currentEntry.timestamp || currentEntry.timestamp < event.created_at) {
                    currentEntry.timestamp = event.created_at;
                }
                return currentEntry;
            });
        },
        [updateEntry],
    );

    const handleDeletion = useCallback(
        (event: NDKEvent) => {
            for (const deletedIdTuple of event.getMatchingTags("e")) {
                const deletedId = deletedIdTuple[1]; // Get the ID from the tag tuple
                if (!deletedId) continue; // Skip if ID is missing

                const entry = allEntriesRef.current.get(deletedId);
                if (entry?.event) {
                    // check if the pubkey matches
                    if (entry.event.pubkey === event.pubkey) {
                        entry.deleted = true;
                        // Potentially trigger an update if needed, e.g., by re-setting the entry
                        allEntriesRef.current.set(deletedId, { ...entry });
                        // Force re-render if this entry is currently visible
                        if (renderedEntryIdsRef.current.has(deletedId)) {
                            updateEntries("deletion");
                        }
                    }
                } else {
                    // we don't have the event, let's just record the deletion
                    updateEntry(deletedId, (currentEntry) => {
                        // Ensure the base object has the required 'id' property
                        const baseEntry = currentEntry ?? { id: deletedId, reposts: [], timestamp: -1 };
                        return {
                            ...baseEntry,
                            deletedBy: [...(baseEntry.deletedBy || []), event.pubkey],
                        };
                    });
                }
            }
        },
        [updateEntry, updateEntries], // Added updateEntries dependency
    );

    const handleEvent = useCallback(
        (event: NDKEvent) => {
            const eventId = event.tagId();
            if (addedEventIds.current.has(eventId)) return;
            addedEventIds.current.add(eventId);

            switch (event.kind) {
                case NDKKind.VerticalVideo:
                case NDKKind.HorizontalVideo:
                case 22:
                case 30018:
                case 30402:
                case NDKKind.Text:
                case NDKKind.Media:
                case NDKKind.Image:
                    return handleContentEvent(eventId, event);
                case NDKKind.GenericRepost:
                    return handleRepost(event);
                case 3006:
                    return handleBookmark(event);
                case NDKKind.EventDeletion:
                    return handleDeletion(event);
            }
        },
        [handleContentEvent, handleRepost, handleBookmark, handleDeletion],
    );

    const handleBulkEvents = useCallback(
        (events: NDKEvent[]) => {
            freezeState.current = true;
            for (const event of events) {
                handleEvent(event);
            }

            freezeState.current = false;
            updateEntries("bulk events");
        },
        [handleEvent, updateEntries],
    );

    const handleEose = useCallback(() => {
        updateEntries("eose");
        eosed.current = true;
    }, [updateEntries]);

    const filterExistingEvents = useCallback(() => {
        let changed = false;

        const passesFilter = (entry: FeedEntry) => !filterFn || filterFn(entry, 0);

        const newRenderEntries = [];

        // Go through the currently-rendered entries and see if we need to change them
        for (const entry of entriesFromIds(renderedEntryIdsRef.current)) {
            const keep = entry?.event && filters && matchFilters(filters, entry.event.rawEvent());
            if (!entry || !keep || !passesFilter(entry)) {
                // Ensure entry is defined
                changed = true;
                renderedIdsRef.current.delete(entry.id);
            } else {
                newRenderEntries.push(entry);
            }
        }

        if (changed) {
            renderedEntryIdsRef.current = new Set(newRenderEntries.map((entry) => entry.id));
            setEntries(newRenderEntries);
        }

        if (!changed) {
            for (const id of newEntriesRef.current) {
                const feedEntry = allEntriesRef.current.get(id);
                // Ensure feedEntry and feedEntry.event exist
                if (!feedEntry || !feedEntry.event || addedEventIds.current.has(id)) continue;
                if (!passesFilter(feedEntry)) continue; // passesFilter expects FeedEntry, already checked feedEntry exists

                const keep =
                    filters && // Ensure filters exist
                    matchFilters(filters, feedEntry.event.rawEvent());
                if (!keep || !passesFilter(feedEntry)) {
                    // passesFilter expects FeedEntry
                    newEntriesRef.current.delete(id);
                    // addedEventIds.current.add(id);
                    changed = true;
                }
            }
        }

        if (changed) updateEntries("filtering out events");
    }, [filters, filterFn, updateEntries, entriesFromIds]); // Added dependencies

    useEffect(() => {
        if (!ndk) return;
        if (!filters) return;

        if (subscription.current) {
            subscription.current.stop();
            subscription.current = undefined;
            eosed.current = false;
            addedEventIds.current.clear();

            filterExistingEvents();
        }

        const sub = ndk.subscribe(
            filters,
            { wrap: true, groupable: false, skipVerification: true, subId, relayUrls },
            {
                onEose: handleEose,
                onEvent: handleEvent,
                onEvents: handleBulkEvents,
            },
        );

        // res will come back with an array of cached events, they need to be filtered (for blacklist and mutes) and then inserted in bulk into the state
        // that the caller will be able to render

        subscription.current = sub;

        return () => {
            sub.stop();
        };
    }, dependencies); // Added dependencies

    return {
        entries,
        newEntries,

        /**
         * When new events arrive after EOSE, they will be collected in the newEntries, this is
         * the function to call to render them.
         */
        updateEntries,
    };
}

type Slice = {
    eventIds: NDKEventId[];
    sub?: NDKSubscription;
    removeTimeout?: NodeJS.Timeout;
};

/**
 * Calculates the slices needed based on the current index and slice size.
 */
function calcNeededSlices(currentIndex: number, sliceSize: number, events: NDKEvent[]) {
    const neededSlices: Slice[] = [];
    const halfSlice = Math.floor(sliceSize / 2);

    const startIndex = Math.max(0, currentIndex - halfSlice);
    const endIndex = Math.min(events.length, startIndex + sliceSize);

    if (events.length > 0) {
        neededSlices.push({
            eventIds: events.slice(startIndex, endIndex).map((e) => e.tagId()),
        });
    }

    return neededSlices;
}

/**
 * Monitors a feed of events and subscribes to related events (reactions, zaps, etc.)
 * for events within a sliding window around the currently active index.
 *
 * @param events The list of events in the feed.
 * @param sliceSize The size of the window to monitor around the active index.
 */
export function useFeedMonitor(events: NDKEvent[], sliceSize = 5) {
    const { ndk } = useNDK();
    const currentPubkey = useNDKCurrentPubkey();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const activeSlices = useRef<Slice[]>([]);
    const activeIds = useRef<Set<NDKEventId>>(new Set());
    const { addPayments } = usePaymentStore();
    const { addEvents } = useReactionsStore();

    const addSlice = (newSlice: Slice) => {
        if (!ndk) return; // Explicit check for ndk before use

        const filter = {
            "#e": newSlice.eventIds,
            kinds: [NDKKind.Reaction, NDKKind.Zap, NDKKind.Repost, NDKKind.GenericRepost],
        };

        const zapFilter = {
            kinds: [NDKKind.ZapRequest],
            "#p": newSlice.eventIds.map((id) => ndk.getUser({ hexpubkey: id }).pubkey),
        };

        newSlice.sub = ndk.subscribe(
            [filter, zapFilter],
            { closeOnEose: false, groupable: true, groupableDelay: 300 },
            {
                onEvent: (event) => {
                    addEvents([event], currentPubkey || undefined);
                    addPayments([event]);
                },
                onEvents: (events) => {
                    addEvents(events, currentPubkey || undefined);
                    addPayments(events);
                },
            },
        );
        activeSlices.current.push(newSlice);
        for (const id of newSlice.eventIds) {
            activeIds.current.add(id);
        }
    };

    const removeSlice = (slice: Slice) => {
        slice.removeTimeout = setTimeout(() => {
            slice.sub?.stop(); // Ensure optional chaining is used
            activeSlices.current = activeSlices.current.filter((s) => s.eventIds[0] !== slice.eventIds[0]);
            for (const id of slice.eventIds) {
                activeIds.current.delete(id);
            }
        }, 500);
    };

    useEffect(() => {
        if (activeIndex === null) return;

        const neededSlices = calcNeededSlices(activeIndex, sliceSize, events);

        // go through the slices we have and determine what we should remove
        for (const activeSlice of activeSlices.current) {
            const keep = neededSlices.find((slice) => slice.eventIds[0] === activeSlice.eventIds[0]);

            if (!keep) {
                if (!activeSlice.removeTimeout) removeSlice(activeSlice);
            } else if (activeSlice.removeTimeout) {
                clearTimeout(activeSlice.removeTimeout);
                activeSlice.removeTimeout = undefined; // Ensure undefined is assigned
            }
        }

        // go through the slices we want and determine what we need to add
        for (const neededSlice of neededSlices) {
            const exists = activeSlices.current.find((slice) => slice.eventIds[0] === neededSlice.eventIds[0]);

            if (!exists) addSlice(neededSlice);
        }

        // // clean up active subs on unmount
    }, [
        activeIndex !== null ? events[activeIndex]?.id : null,
        events.length < sliceSize,
        sliceSize,
        ndk,
        currentPubkey || undefined,
        addPayments,
    ]); // Added dependencies

    useEffect(() => {
        // Stop all subscriptions when the component unmounts
        return () => {
            activeSlices.current.forEach((slice) => slice.sub?.stop()); // Ensure optional chaining is used
        };
    }, []);

    return {
        setActiveIndex,
    };
}
