import { NDKEvent, NDKFilter, NDKSubscriptionOptions } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import Post from '../events/Post';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeedEntry, useFeedEvents, useFeedMonitor } from './hook';
import { Pressable, RefreshControl, Text, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSetAtom } from 'jotai';
import { activeEventAtom } from '@/stores/event';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { EventMediaGridContainer } from '../media/event';
import { scrollDirAtom } from './store';

type FeedProps = {
    onPress?: (event: NDKEvent) => void;
    filters: NDKFilter[];
    filterKey: string;
    filterOpts?: NDKSubscriptionOptions;
    prepend?: React.ReactNode;
    filterFn?: (feedEntry: FeedEntry, index: number) => boolean;
    relayUrls?: string[];
    numColumns?: number;
};

type PrependEntry = {
    id: string;
    node: React.ReactNode;
};

const keyExtractor = (entry: FeedEntry | PrependEntry) => entry.id;

export default function Feed({ filters, filterKey, prepend, filterFn, relayUrls, numColumns = 1, filterOpts }: FeedProps) {
    const visibleIndex = useRef(0);
    const ref = useRef<FlashList<any> | null>(null);
    const [refreshCount, setRefreshCount] = useState(0);

    useScrollToTop(ref);

    const sliceIndex = numColumns * 7;
    const { entries, newEntries, updateEntries } = useFeedEvents(filters, { subId: 'feed', filterFn, relayUrls, ...filterOpts }, [
        filterKey + refreshCount,
    ]);
    const { setActiveIndex } = useFeedMonitor(
        entries.map((e) => e.event),
        sliceIndex
    );

    const [showNewEntriesPrompt, setShowNewEntriesPrompt] = useState(false);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }) => {
            visibleIndex.current = viewableItems[0]?.index ?? 0;
            if (visibleIndex.current === 0 && showNewEntriesPrompt) {
                setShowNewEntriesPrompt(false);
            }
            setActiveIndex(visibleIndex.current);
        },
        [setActiveIndex, showNewEntriesPrompt]
    );

    const update = useCallback(() => {
        if (!ref.current) return;
        ref.current.scrollToIndex({
            animated: true,
            index: 0,
        });
        updateEntries('update run');
        setShowNewEntriesPrompt(false);
    }, [updateEntries]);

    useEffect(() => {
        if (newEntries.length === 0) return;
        if (entries.length === 0) {
            updateEntries('no visible entries');
            return;
        }
        if (visibleIndex.current === 0) {
            updateEntries('visible index is 0');
            return;
        }

        if (visibleIndex.current > 0 && !showNewEntriesPrompt) {
            setShowNewEntriesPrompt(true);
        }
    }, [newEntries?.length, showNewEntriesPrompt]);

    const setActiveEvent = useSetAtom(activeEventAtom);

    const [refreshing, setRefreshing] = useState(false);

    const forceRefresh = useCallback(() => {
        setRefreshing(true);
        updateEntries('force refresh');
        setShowNewEntriesPrompt(false);
        setRefreshCount(refreshCount + 1);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, [updateEntries, refreshCount]);

    const renderEntries = useMemo(() => {
        let ret: (FeedEntry | PrependEntry)[] = [...entries];

        if (numColumns > 1) {
            // sort entries by whether they have an imeta tag, if they do, sort by timestamp
            // ret = ret.sort((a, b) => {
            // const aHasImeta = a.event.tags.some(tag => tag.name === 'imeta');
            // const bHasImeta = b.event.tags.some(tag => tag.name === 'imeta');
            // if (aHasImeta && !bHasImeta) return -1;
            // if (!aHasImeta && bHasImeta) return 1;
            // return a.event.created_at! - b.event.created_at!;
            // });
        }

        if (prepend && numColumns === 1) ret.unshift({ id: 'prepend', node: prepend });

        return ret;
    }, [entries, prepend, numColumns]);

    const handleGridPress = useCallback((event: NDKEvent) => {
        setActiveEvent(event);
        router.push(`/view`);
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: FeedEntry | PrependEntry; index: number }) => {
            if (numColumns === 1 && index === 0 && item.id === 'prepend') return (item as PrependEntry).node;
            item = item as FeedEntry;

            if (numColumns === 1) return <Post event={item.event} index={index} reposts={item.reposts} timestamp={item.timestamp} />;
            else
                return (
                    <EventMediaGridContainer
                        event={item.event}
                        index={index}
                        forceProxy={true}
                        numColumns={numColumns}
                        onPress={() => handleGridPress(item.event)}
                    />
                );
        },
        [numColumns]
    );

    const scrollPosRef = useRef(0);
    const scrollDirRef = useRef<'up' | 'down'>('down');
    const minScrollThreshold = 60; // minimum pixels to scroll before changing direction

    useEffect(() => {
        setScrollDir('up');
    }, [filterKey]);

    const setScrollDir = useSetAtom(scrollDirAtom);
    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPos = event.nativeEvent.contentOffset.y;
        const scrollDiff = Math.abs(currentScrollPos - scrollPosRef.current);
        const scrollDir = currentScrollPos < scrollPosRef.current ? 'up' : 'down';

        if (currentScrollPos < 20 && scrollDirRef.current === 'down') {
            setScrollDir('up');
            scrollDirRef.current = 'up';
            scrollPosRef.current = currentScrollPos;
            return;
        }

        if (scrollDiff < minScrollThreshold) return;

        if (scrollDir === 'up' && scrollDirRef.current === 'down') {
            setScrollDir('up');
            scrollDirRef.current = 'up';
        } else if (scrollDir === 'down' && scrollDirRef.current === 'up') {
            setScrollDir('down');
            scrollDirRef.current = 'down';
        }
        scrollPosRef.current = currentScrollPos;
    }, []);

    return (
        <>
            {showNewEntriesPrompt && (
                <Pressable style={styles.newEntriesPrompt} onPress={update}>
                    <Text className="text-sm text-white">{newEntries.length} new posts</Text>
                </Pressable>
            )}
            {renderEntries.length > 0 && (
                <FlashList
                    ref={ref}
                    data={renderEntries}
                    estimatedItemSize={500}
                    keyExtractor={keyExtractor}
                    onViewableItemsChanged={onViewableItemsChanged}
                    onScroll={onScroll}
                    scrollEventThrottle={100}
                    numColumns={numColumns}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={forceRefresh} />}
                    getItemType={(item) => (item.id === 'prepend' ? 'prepend' : 'post')}
                    renderItem={renderItem}
                    disableIntervalMomentum={true}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    newEntriesPrompt: {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: [{ translateX: -50 }],
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 10,
    },
});
