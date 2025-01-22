import { NDKEvent, NDKEventId, NDKFilter, useFollows } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import Post from "../events/Post";
import { ForwardedRef, forwardRef, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedEntry, useFeedEvents, useFeedMonitor } from "./hook";
import { Pressable, RefreshControl, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { ArrowUp } from "lucide-react-native";
import { useSetAtom } from "jotai";
import { activeEventAtom } from "@/stores/event";
import { router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";

type FeedProps = {
    onPress?: (event: NDKEvent) => void;
    filters: NDKFilter[];
    filterKey: string;
    prepend?: React.ReactNode;
    filterByFollows?: boolean;
    filterFn?: (feedEntry: FeedEntry, index: number) => boolean
}

const keyExtractor = (entry: FeedEntry) => entry.id;

export default function Feed({ onPress, filters, filterKey, prepend, filterByFollows, filterFn }: FeedProps) {
    const visibleIndex = useRef(0);
    const ref = useRef<FlashList<any> | null>();
    const [refreshCount, setRefreshCount] = useState(0);

    useScrollToTop(ref);

    const { entries, newEntries, updateEntries } = useFeedEvents(filters, { subId: 'feed', filterByFollows, filterFn }, [filterKey + refreshCount]);
    const { setActiveIndex } = useFeedMonitor(entries.map(e => e.event))

    // useEffect(() => {
    //     console.log('rendering feed', entries?.length, newEntries?.length)
    // }, [entries?.length])

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
    useEffect(() => {
        if (newEntries.length === 0) return;
        const firstVisibleEntryTimestamp = entries[0]?.timestamp;
        if (!firstVisibleEntryTimestamp) updateEntries('no visible entries');
        const firstNewEntryTimestamp = newEntries[0].timestamp;
        if (firstVisibleEntryTimestamp < firstNewEntryTimestamp) {
            if (visibleIndex?.current === 0) updateEntries('visible index is 0');
            else setShowNewEntriesPrompt(true)
        }
    }, [newEntries?.length])

    const setActiveEvent = useSetAtom(activeEventAtom);

    const _onPress = useCallback((event: NDKEvent) => {
        if (onPress) onPress(event)
        else {
            setActiveEvent(event);
            router.push('/view');
        }
    }, [onPress, setActiveEvent])

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
        const ret: (FeedEntry | { id: string, node: React.ReactNode })[] = [...entries];
        if (prepend) ret.unshift({ id: 'prepend', node: prepend });
        return ret;
    }, [entries, prepend])

    return (
        <>
        {showNewEntriesPrompt && (
            <Pressable className="absolute flex flex-row gap-2 z-50 top-0 left-1/2 -translate-x-1/2 bg-accent px-4 py-2 rounded-full" onPress={update}>
                <ArrowUp color="white" />
                <Text className="text-white">New posts</Text>
            </Pressable>
        )}
        <FlashList
            ref={ref}
            data={renderEntries}
            estimatedItemSize={500}
            keyExtractor={keyExtractor}
            onViewableItemsChanged={onViewableItemsChanged}
            scrollEventThrottle={100}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={forceRefresh} />}
            getItemType={item => item.id === 'prepend' ? 'prepend' : 'post'}
            renderItem={({ item, index }) => {
                if (item.id === 'prepend') return item.node;
                return <Post 
                    event={item.event} 
                    index={index} 
                    reposts={item.reposts} 
                    timestamp={item.timestamp} 
                    onPress={() => _onPress(item.event)} 
                />;
            }}
            disableIntervalMomentum={true}
        />
        </>
    )
}