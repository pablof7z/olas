import { Pressable, View } from "react-native";
import { Dimensions } from "react-native";
import { MasonryFlashList } from "@shopify/flash-list";
import { NDKEvent, NDKImage, NDKKind, NDKSubscriptionCacheUsage, useNDKCurrentUser, useSubscribe } from "@nostr-dev-kit/ndk-mobile";
import { useCallback, useMemo } from "react";
import EventMediaContainer from "@/components/media/event";
import { Text } from "@/components/nativewindui/Text";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { activeEventAtom } from "@/stores/event";
import { useObserver } from "@/hooks/observer";
let cellWidth = 0;
let cellHeight = 0;

const COLUMNS = 4;

function DayCell({ day, events, index }: { day: number, events: NDKEvent[], index: number }) {
    const { colors } = useColorScheme();
    const setActiveEvent = useSetAtom(activeEventAtom);

    const style = useMemo(() => {
        const pos = index % COLUMNS;

        return {
            width: cellWidth,
            height: cellHeight,
            borderLeftWidth: pos > 0 ? 1 : 0,
            borderBottomWidth: 1,
            borderColor: colors.grey5,
        }
    }, [cellWidth, cellHeight, index]);

    const openEvent = useCallback(() => {
        if (!events?.[0]) return;
        setActiveEvent(events[0]);
        router.push('/view');
    }, [events?.[0]?.id, setActiveEvent]);
    
    return (
        <Pressable className="flex-1 items-center relative bg-foreground/20" style={{ ...style, overflow: 'hidden' }}>
            {events && events.length > 0 && <EventMediaContainer onPress={openEvent} singleMode event={events[0]} maxWidth={cellWidth} maxHeight={cellHeight} />}
            <Text className="text-center text-sm absolute bottom-0  z-50 text-white rounded-md overflow-hidden py-1 px-2 bg-black/50">Day {day}</Text>
        </Pressable>
    )
}

const currentYear = new Date().getFullYear();

function getDayOfYear(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
    const difference_In_Days = Math.ceil(diffTime / (1000 * 3600 * 24)); 

    if (year !== currentYear) return;
    
    return difference_In_Days;
}

export default function ThreeSixtyFivePage() {
    // days this year
    const viewableScreenWidth = Dimensions.get('window').width;
    const minimumCellWidth = 50;
    const currentUser = useNDKCurrentUser();
    const filters = currentUser ? [{ kinds: [NDKKind.Image], authors: [currentUser.pubkey] }] : false;
    const events = useObserver(filters);

    cellWidth = Math.max(minimumCellWidth, viewableScreenWidth / COLUMNS);
    cellHeight = cellWidth;

    const dayOfTodayInTheYear = getDayOfYear(new Date().getTime() / 1000);
    
    const days = Array.from({ length: dayOfTodayInTheYear }, (_, index) => index + 1);

    const eventsPerDayOfYear = useMemo(() => {
        const eventsPerDay: Record<number, NDKEvent[]> = {};

        for (const event of events) {
            const day = getDayOfYear(event.created_at);
            if (!day) continue;
            eventsPerDay[day] = (eventsPerDay[day] || []).concat(event);
        }

        return eventsPerDay;
    }, [events]);

    return <View className="flex-1 w-full">
        <MasonryFlashList
            data={days}
            keyExtractor={(item) => item.toString()}
            numColumns={COLUMNS}
            renderItem={({ item, index }) => <DayCell day={item} events={eventsPerDayOfYear[item]} index={index} />}
            estimatedItemSize={cellHeight}
        />
    </View>
}