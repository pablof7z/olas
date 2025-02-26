import { NDKEvent, NDKEventId, NDKFilter } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import Post from "../events/Post";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedEntry, useFeedEvents, useFeedMonitor } from "./hook";
import { Pressable, RefreshControl, Text, StyleSheet } from "react-native";
import { useSetAtom } from "jotai";
import { activeEventAtom } from "@/stores/event";
import { router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { EventMediaGridContainer } from "../media/event";
import { usePostBottomSheet } from "@/hooks/post-bottom-sheet";

type FeedProps = {
    onPress?: (event: NDKEvent) => void;
    filters: NDKFilter[];
    filterKey: string;
    prepend?: React.ReactNode;
    filterFn?: (feedEntry: FeedEntry, index: number) => boolean
    relayUrls?: string[]
    numColumns?: number
}

type PrependEntry = {
    id: string;
    node: React.ReactNode;
}

const keyExtractor = (entry: FeedEntry) => entry.id;

export default function Feed({
    filters,
    filterKey,
    prepend,
    filterFn,
    relayUrls,
    numColumns = 1
}: FeedProps) {
    const visibleIndex = useRef(0);
    const ref = useRef<FlashList<any> | null>();
    const [refreshCount, setRefreshCount] = useState(0);

    useScrollToTop(ref);

    const sliceIndex = numColumns * 7;
    const { entries, newEntries, updateEntries } = useFeedEvents(filters, { subId: 'feed', filterFn, relayUrls }, [filterKey + refreshCount]);
    const { setActiveIndex } = useFeedMonitor(entries.map(e => e.event), sliceIndex)

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        visibleIndex.current = viewableItems[0]?.index ?? null;
        if (visibleIndex.current === 0 && showNewEntriesPrompt) setShowNewEntriesPrompt(false)
        setActiveIndex(visibleIndex.current)
    }, []);

    const update = useCallback(() => {
        if (!ref.current) return;
        ref.current.scrollToIndex({
            animated: true,
            index: 0
        })
        updateEntries('update run');
        setShowNewEntriesPrompt(false)
    }, [updateEntries]);

    const [showNewEntriesPrompt, setShowNewEntriesPrompt] = useState(false);
    
    // useEffect(() => console.log('update entries changes'), [updateEntries])
    // useEffect(() => console.log('new entries changes', newEntries?.length), [newEntries?.length])
    // useEffect(() => console.log('entries changes', entries?.length), [entries?.length])
    // useEffect(() => console.log('setActiveIndex changes'), [setActiveIndex])
    // useEffect(() => console.log('showNewEntriesPrompt changes'), [showNewEntriesPrompt])

    useEffect(() => {
        if (newEntries.length === 0) return;
        if (entries.length === 0) {
            updateEntries('no visible entries');
            return;
        }
        if (visibleIndex?.current === 0) {
            updateEntries('visible index is 0');
            return;
        }

        if (visibleIndex?.current > 0 && !showNewEntriesPrompt) setShowNewEntriesPrompt(true)
    }, [newEntries?.length, showNewEntriesPrompt])

    const setActiveEvent = useSetAtom(activeEventAtom);

    const [refreshing, setRefreshing] = useState(false);

    const forceRefresh = useCallback(() => {
        setRefreshing(true);
        updateEntries('force refresh');
        setShowNewEntriesPrompt(false)
        setRefreshCount(refreshCount + 1);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, [updateEntries, setRefreshCount, setRefreshing]);
    
    const renderEntries = useMemo(() => {
        let ret: (FeedEntry | PrependEntry)[] = [...entries];

        if (numColumns > 1) {
            // sort entries by whether they have an imeta tag, if they do, sort by timestamp
            ret = ret
                // .sort((a, b) => {
                // const aHasImeta = a.event.tags.some(tag => tag.name === 'imeta');
                // const bHasImeta = b.event.tags.some(tag => tag.name === 'imeta');
                // if (aHasImeta && !bHasImeta) return -1;
                // if (!aHasImeta && bHasImeta) return 1;
                // return a.event.created_at! - b.event.created_at!;
            // });
        }
        
        if (prepend && numColumns === 1) ret.unshift({ id: 'prepend', node: prepend });

        return ret;
    }, [entries, prepend, numColumns])

    const renderItem = useCallback(({ item, index }: { item: FeedEntry | PrependEntry, index: number }) => {
        if (numColumns === 1 && index === 0 && item.id === 'prepend') return (item as PrependEntry).node;
        item = item as FeedEntry;
        
        if (numColumns === 1) return (
            <Post 
                event={item.event} 
                index={index} 
                reposts={item.reposts} 
                timestamp={item.timestamp} 
            />
        )
        else return <EventMediaGridContainer
            event={item.event}
            index={index}
            forceProxy={true}
            onPress={() => {
                setActiveEvent(item.event);
                router.push('/view');
            }}
            onLongPress={() => { }}
        />
    }, [numColumns])

    return (
        <>
            {showNewEntriesPrompt && (
                <Pressable style={styles.newEntriesPrompt} onPress={update}>
                    <Text className="text-white text-sm">{newEntries.length} new posts</Text>
                </Pressable>
            )}
            <FlashList
                ref={ref}
                data={renderEntries}
                estimatedItemSize={500}
                keyExtractor={keyExtractor}
                onViewableItemsChanged={onViewableItemsChanged}
                scrollEventThrottle={100}
                numColumns={numColumns}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={forceRefresh} />}
                getItemType={item => item.id === 'prepend' ? 'prepend' : 'post'}
                renderItem={renderItem}
                disableIntervalMomentum={true}
            />
        </>
    )
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
    }

})