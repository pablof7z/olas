import type { NDKEvent, NDKFilter, NDKSubscriptionOptions } from '@nostr-dev-kit/ndk-mobile';
import { useScrollToTop } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    type ViewToken,
} from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';

import Post from '../events/Post';
import { EventMediaGridContainer } from '../media/event';
import { type FeedEntry, useFeedEvents, useFeedMonitor } from './hook';

import { activeEventAtom } from '@/stores/event';
import Thread from '../events/Thread';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<FeedEntry>);

import type { SharedValue } from 'react-native-reanimated';

export type FeedProps = {
    onPress?: (event: NDKEvent) => void;
    filters: NDKFilter[];
    filterKey: string;
    filterOpts?: NDKSubscriptionOptions;
    filterFn?: (feedEntry: FeedEntry, index: number) => boolean;
    relayUrls?: string[];
    numColumns?: number;
    ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
    scrollEventThrottle?: number;

    /**
     * Optional Reanimated shared value for scroll position.
     * If provided, Feed will update this value on scroll.
     */
    scrollY?: SharedValue<number>;

    /**
     * Optional callback for scroll Y position (JS thread).
     */
    onScrollYChange?: (y: number) => void;
};

const keyExtractor = (entry: FeedEntry) => entry.id;

const Feed = React.forwardRef<FlashList<any>, FeedProps>(function Feed(
    props,
    ref: React.Ref<FlashList<any>>
) {
    const {
        filters,
        filterKey,
        filterFn,
        relayUrls,
        numColumns = 1,
        filterOpts,
        ListHeaderComponent,
        scrollEventThrottle,
        scrollY,
        onScrollYChange,
    } = props;

    // Compose handlers: update scrollY prop if provided, also call parent if provided
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (scrollY !== undefined) {
                scrollY.value = event.contentOffset.y;  // UI-thread-safe assignment
            }
            if (typeof onScrollYChange === 'function') {
                // Call on JS thread
                runOnJS(onScrollYChange)(event.contentOffset.y);
            }
        },
    });

    const innerRef = useRef<FlashList<any>>(null);
    const visibleIndex = useRef(0);
    const [refreshCount, setRefreshCount] = useState(0);

    // Expose the local ref to the parent
    React.useImperativeHandle(ref, () => innerRef.current!);

    // useScrollToTop expects a RefObject
    useScrollToTop(innerRef);

    const sliceIndex = numColumns * 7;
    const { entries, newEntries, updateEntries } = useFeedEvents(
        filters,
        { subId: 'feed', filterFn, relayUrls, ...filterOpts },
        [filterKey + refreshCount]
    );
    const { setActiveIndex } = useFeedMonitor(
        entries.map((e) => e.events[0]).filter((e) => !!e),
        sliceIndex
    );

    const [showNewEntriesPrompt, setShowNewEntriesPrompt] = useState(false);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            visibleIndex.current = viewableItems[0]?.index ?? 0;
            if (visibleIndex.current === 0 && showNewEntriesPrompt) {
                setShowNewEntriesPrompt(false);
            }
            setActiveIndex(visibleIndex.current);
        },
        [setActiveIndex, showNewEntriesPrompt]
    );

    const update = useCallback(() => {
        if (innerRef.current) {
            innerRef.current.scrollToIndex({
                animated: true,
                index: 0,
            });
        }
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

    const handleGridPress = useCallback((event: NDKEvent) => {
        setActiveEvent(event);
        router.push('/view');
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: FeedEntry; index: number }): React.ReactElement | null => {
            item = item as FeedEntry;

            if (!item.events[0]) return null;

            if (numColumns === 1) {
                if (item.events.length === 1) {
                    return (
                        <Post
                            key={item.events[0]!.id}
                            event={item.events[0]!}
                            index={index}
                            reposts={item.reposts}
                            timestamp={item.timestamp}
                        />
                    );
                } else if (item.events.length > 1) {
                    return <Thread events={item.events} />;
                }
            } else {
                return (
                    <EventMediaGridContainer
                        event={item.events[0]}
                        index={index}
                        forceProxy
                        numColumns={numColumns}
                        onPress={() => handleGridPress(item.events[0]!)}
                    />
                );
            }
            return null;
        },
        [numColumns]
    );

    return (
        <>
            {showNewEntriesPrompt && (
                <Pressable style={styles.newEntriesPrompt} onPress={update}>
                    <Text className="text-sm text-white">{newEntries.length} new posts</Text>
                </Pressable>
            )}
            {entries.length > 0 && (
                <AnimatedFlashList
                    ref={innerRef}
                    data={entries}
                    estimatedItemSize={500}
                    keyExtractor={keyExtractor}
                    onViewableItemsChanged={onViewableItemsChanged}
                    onScroll={scrollHandler}
                    scrollEventThrottle={scrollEventThrottle ?? 100}
                    numColumns={numColumns}
                    ListHeaderComponent={ListHeaderComponent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={forceRefresh} />
                    }
                    renderItem={renderItem}
                    disableIntervalMomentum
                />
            )}
        </>
    );
});

export default Feed;

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
    animatedBlur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 100,
        width: '100%',
    },
});
