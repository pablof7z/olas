import { useSubscribe, useNDK, useUserProfile, NDKEventId, NDKRelaySet, Hexpubkey, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useHeaderHeight } from '@react-navigation/elements';
import { useStore } from 'zustand';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post from '@/components/events/Post';
import { RefreshControl } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { useScroll } from '~/contexts/ScrollContext';
import FilterButton from '@/components/FilterButton';
import NotificationsButton from '@/components/NotificationsButton';
import { Text } from '@/components/nativewindui/Text';
import { ChevronDown, Repeat, User, Waves } from 'lucide-react-native';
import { DropdownMenu } from '@/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '@/components/nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';

const blacklist = new Set<Hexpubkey>([
    '0403c86a1bb4cfbc34c8a493fbd1f0d158d42dd06d03eaa3720882a066d3a378'
]);

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

export default function HomeScreen() {
    const [includeTweets, setIncludeTweets] = useState(false);
    const [feedType, setFeedType] = useState<'follows' | 'local' | string>('local');
    const { colors } = useColorScheme();
    
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerLeft: () =>
                        <HomeTitle feedType={feedType} setFeedType={setFeedType} />,
                    headerTitle: () => <Waves size={24} color={colors.foreground} />,
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <FilterButton includeTweets={includeTweets} setIncludeTweets={setIncludeTweets} />
                            <NotificationsButton />
                        </View>
                    ),
                }}
            />
            
            <DataList feedType={feedType} includeTweets={includeTweets} />
        </>
    );
}

function DataList({ feedType, includeTweets }: { feedType: string; includeTweets: boolean }) {
    const { ndk, currentUser } = useNDK();
    const { useSessionStore } = useNDKSession();
    const follows = useSessionStore(state => state.follows);

    // const { muteList, wot } = useNDKSession();
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const scrollRef = useScroll();
    const headerHeight = useHeaderHeight();
    const filters = useMemo(() => {
        let relaySet: NDKRelaySet | undefined;
        
        const filters: NDKFilter[] = [
            { kinds: [NDKKind.Image, NDKKind.HorizontalVideo ] },
            { kinds: [NDKKind.Text], '#k': ['20'] },
            // { kinds: [NDKKind.Text], authors: follows },
            { kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': [NDKKind.Image.toString()], limit: 1 },
        ];

        if (feedType === 'follows' && follows?.length > 2) {
            filters[0].authors = [...follows];
            filters[1].authors = [...follows];
            if (currentUser) {
                filters[0].authors?.push(currentUser.pubkey);
                filters[1].authors?.push(currentUser.pubkey);
            }
        }

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
                renderItem={({ item, index }) => (
                    <View style={{ paddingTop: index === 0 ? headerHeight : 0 }}>
                        <Post event={item} reposts={[]} timestamp={item.created_at} />
                    </View>
                )}
                disableIntervalMomentum={true}
                contentContainerStyle={styles.listContainer}
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

    const relays = useMemo(() => ndk.pool.connectedRelays().map((r) => r.url), [ndk, i]);

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
                    title: 'Local',
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
                        {feedType === 'follows' ? 'Follows' : 'Local'}
                    </Text>
                    <ChevronDown size={16} color={colors.foreground} />
                </Pressable>
            </DropdownMenu>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: 'grey',
    },
    contentContainer: {
        flex: 1,
        height: 300,
        width: '100%',
        alignItems: 'center',
    },
    card: {
        paddingVertical: 20,
        paddingHorizontal: 25,
        borderRadius: 15,
        elevation: 4,
        alignItems: 'flex-start',
        marginVertical: 10,
        marginHorizontal: 16,
        height: 200,
        width: Dimensions.get('window').width * 0.75,
    },
    title: {
        fontSize: 16,
        color: '#ffffffa0', // Lighter translucent white for title
        marginBottom: 4,
        fontWeight: '500',
    },
    balance: {
        fontSize: 42, // Reduced font size slightly to fit within the card
        lineHeight: 52,
        fontWeight: '700',
        color: '#fff',
    },
    currency: {
        fontSize: 16,
        fontWeight: '500',
        color: '#ffffffa0', // Matches the BTC color with lighter opacity
    },
    time: {
        fontSize: 14,
        color: '#ffffffc0', // Higher opacity than "transaction" for emphasis
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 100,
    },
});
