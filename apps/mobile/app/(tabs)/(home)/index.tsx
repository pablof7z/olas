import { useSubscribe, NDKEventId, NDKRelaySet, Hexpubkey } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post from '@/components/events/Post';
import { RefreshControl } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import FilterButton from '@/components/FilterButton';
import NotificationsButton from '@/components/NotificationsButton';
import { Text } from '@/components/nativewindui/Text';
import { ChevronDown } from 'lucide-react-native';
import { DropdownMenu } from '@/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '@/components/nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { homeScreenScrollRef } from '@/atoms/homeScreen';
import { useSetAtom } from 'jotai';

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

export default function HomeScreen() {
    const [includeTweets, setIncludeTweets] = useState(false);
    const [feedType, setFeedType] = useState<'follows' | 'local' | string>('local');

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: false,
                    // header: () => (
                    //     <View style={{ flexDirection: 'column' }}>
                    //         <View style={{ height: inset.top, backgroundColor: 'red' }} />
                    //         <View className='flex-1 flex-row justify-between items-center px-2'>
                    //             <HomeTitle feedType={feedType} setFeedType={setFeedType} />
                    //             <NotificationsButton />
                    //         </View>
                    //     </View>
                    // ),
                    headerLeft: () => <HomeTitle feedType={feedType} setFeedType={setFeedType} />,
                    title: "",
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', gap: 10}}>
                            <FilterButton includeTweets={includeTweets} setIncludeTweets={setIncludeTweets} />
                            <NotificationsButton />
                        </View>
                    ),
                }}
            />
            
            <DataList 
                feedType={feedType} 
                includeTweets={includeTweets} 
            />
        </>
    );
}

function DataList({ 
    feedType, 
    includeTweets,
}: { 
    feedType: string; 
    includeTweets: boolean;
}) {
    const { currentUser, ndk, randomId } = useNDK();
    const { follows } = useNDKSession();

    const scrollRef = useRef(null);
    const setHomeScreenScrollRef = useSetAtom(homeScreenScrollRef);

    useEffect(() => {
        if (scrollRef.current) {
            setHomeScreenScrollRef(scrollRef.current);
        }
    }, [scrollRef.current]);

    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const filters = useMemo(() => {
        let relaySet: NDKRelaySet | undefined;

        const followsFilter = feedType === 'follows' && follows?.length > 2 ? {authors: [...follows, currentUser?.pubkey]} : {};
        
        const filters: NDKFilter[] = [
            { kinds: [NDKKind.Image, NDKKind.HorizontalVideo ], ...followsFilter },
            { kinds: [NDKKind.Text], '#k': ['20'], ...followsFilter },
            { kinds: [NDKKind.Text], authors: follows },
            { kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': [NDKKind.Image.toString()], limit: 1, ...followsFilter },
        ];

        if (includeTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50 });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50 });

            relaySet = NDKRelaySet.fromRelayUrls(['wss://relay.olas.app'], ndk);
        }

        if (tagFilter) filters.push({ kinds: [1], '#t': [tagFilter] });

        return filters;
    }, [follows?.length, includeTweets, tagFilter, feedType, currentUser]);

    const opts = useMemo(() => ({ skipVerification: true, groupable: false, closeOnEose: true, wot: true }), []);
    
    const relays = useMemo(() => {
        if (includeTweets) return ['wss://relay.olas.app'];
        return [];
    }, [includeTweets]);
    const { events } = useSubscribe({ filters, relays, opts });

    type EventWithReposts = { event: NDKEvent | undefined, reposts: NDKEvent[], timestamp: number };

    const eventIdsRef = useRef<Set<NDKEventId>>(new Set());
    const eventMapRef = useRef<Map<NDKEventId, EventWithReposts>>(new Map());

    // const selectedEvents = useMemo(() => {
    //     const eventMap = new Map<NDKEventId, EventWithReposts>(eventMapRef.current);

    //     const addEvent = (event: NDKEvent) => {
    //         if (event.kind === NDKKind.GenericRepost) {
    //             const eventId = event.tagValue("e");

    //             if (!eventId) return;
    //             if (!eventMap.has(eventId)) {
    //                 // add the event to the map
    //                 try {
    //                     const payload = JSON.parse(event.content);
    //                     const originalEvent = new NDKEvent(event.ndk, payload);
    //                     eventMap.set(eventId, { event: originalEvent, reposts: [event], timestamp: event.created_at });
    //                 } catch (e) {
    //                     eventMap.set(eventId, { event: undefined, reposts: [], timestamp: event.created_at });
    //                 }
    //             } else {
    //                 // update the reposts and timestamp
    //                 const current = eventMap.get(eventId)!;
    //                 current.reposts.push(event);
    //                 if (current.timestamp < event.created_at) {
    //                     // TODO: don't update the timestamp if the event has already been seen (we need a ref to keep track of seen posts)
    //                     current.timestamp = event.created_at;
    //                 }
    //                 eventMap.set(eventId, current);
    //             }
    //         } else {
    //             eventMap.set(event.id, { event, reposts: [], timestamp: event.created_at });
    //         }
    //     }

    //     for (const event of events) {
    //         if (blacklist.has(event.pubkey)) continue;
    //         if (eventIdsRef.current.has(event.id)) continue;
    //         eventIdsRef.current.add(event.id);
            
    //         if ([NDKKind.HorizontalVideo, NDKKind.VerticalVideo, NDKKind.Image, NDKKind.GenericRepost].includes(event.kind)) {
    //             addEvent(event);
    //         }

    //         if (event.kind === NDKKind.Text) {
    //             const content = event.content;
    //             const urlMatch = content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
    //             if (urlMatch) {
    //                 addEvent(event);
    //             }
    //         }
    //     }

    //     eventMapRef.current = eventMap;

    //     return Array.from(eventMap.values())
    //         .filter((event) => event.event !== undefined)
    //         .sort((a, b) => b.timestamp - a.timestamp);
    // }, [events]);

    const loadUserData = () => {
        // Pick a random tag when refreshing
        const randomTag = randomPhotoTags[Math.floor(Math.random() * randomPhotoTags.length)];
        setTagFilter(randomTag);
    };

    return (
        <View className="flex-1 gap-2 bg-card">
            <FlashList
                ref={scrollRef}
                data={events}
                estimatedItemSize={500}
                keyExtractor={(event) => event.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadUserData} />}
                scrollEventThrottle={100}
                renderItem={({ item, index }) => (
                        <Post event={item} reposts={[]} timestamp={item.created_at} />
                )}
                disableIntervalMomentum={true}
                />
        </View>
    )
}

function HomeTitle({ feedType, setFeedType }: { feedType: string; setFeedType: (feedType: string) => void }) {
    const { colors } = useColorScheme();
    const { ndk } = useNDK();

    const [i, setI] = useState(0);

    ndk.pool.on('relay:ready', () => setI(i + 1));
    ndk.pool.on('relay:disconnect', () => setI(i - 1));

    const relays = useMemo(() => ndk.pool.connectedRelays().map((r) => r.url), [ndk?.pool, i]);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
            <DropdownMenu
                items={[
                    createDropdownItem({
                    actionKey: 'follows',
                    title: 'Follows',
                    subTitle: 'Posts from people you follow',
                    state: { checked: feedType === 'follows' },
                }),
                createDropdownItem({
                    actionKey: 'local',
                    title: 'For You',
                    subTitle: 'Posts from all relays you are connected to',
                    state: { checked: feedType === 'local' },
                }),
                ...relays.map((relay) => createDropdownItem({
                    actionKey: relay,
                    title: relay,
                        subTitle: relay,
                        state: { checked: feedType === relay },
                    })),
            ]}
            onItemPress={(item) => {
                if (item.actionKey === 'follows') setFeedType('follows');
                if (item.actionKey === 'local') setFeedType('local');
            }}>
                <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text className="font-semibold text-xl">
                        {feedType === 'follows' ? 'Follows' : 'For You'}
                    </Text>
                    <ChevronDown size={16} color={colors.foreground} />
                </Pressable>
            </DropdownMenu>
        </View>
    );
}
