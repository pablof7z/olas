import {
    useSubscribe,
    NDKEventId,
    NDKRelaySet,
    useMuteList,
    NDKSubscriptionCacheUsage,
    NDKSubscription,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post from '@/components/events/Post';
import { RefreshControl, } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { Bookmark, ChevronDown } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useFollows, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import NotificationsButton from '@/components/NotificationsButton';
import PostOptionsMenu from '@/components/events/Post/OptionsMenu';
import { Checkbox } from '@/components/nativewindui/Checkbox';

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

const includeTweetsAtom = atom(false);

const titleAtom = atom(0);
const feedTypeAtom = atom<'follows' | 'local' | string>('local');

export default function HomeScreen() {
    const [feedType, setFeedType] = useAtom(feedTypeAtom);
    const [title, setTitle] = useAtom(titleAtom);

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
                    headerLeft: () => <HomeTitle />,
                    title: '',
                    // headerRight: () => <Pressable onPress={() => setTitle(0)}><Text>{title}</Text></Pressable>,
                    headerRight: () => <View className="flex-row items-center gap-2">
                        <Pressable onPress={() => router.push('/bookmarks')}>
                            <Bookmark size={24} />
                        </Pressable>
                        <NotificationsButton />
                    </View>,
                }}
            />

            {/* <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ flex: 1, height: 100 }} className="flex-none">
                    <Stories />
                </View>
             */}
            <DataList feedType={feedType} />
            {/* </View> */}
        </>
    );
}

// function StoryEntry({ pubkey, events }: { pubkey: string, events: NDKEvent[] }) {
//     const { userProfile } = useUserProfile(pubkey);

//     return (
//         <UserAvatar userProfile={userProfile} size={40} className="w-16 h-16 border-2 border-accent rounded-full" />
//     );
// }

// const storiesFilters: NDKFilter[] = [
//     { kinds: [NDKKind.HorizontalVideo], limit: 10 },
// ];
// const storiesOpts = { closeOnEose: true, klass: NDKVideo, groupable: false };

// function Stories() {
//     const { events } = useSubscribe({ filters: storiesFilters, opts: storiesOpts });
//     const eventsMap = useMemo(() => {
//         const map = new Map<string, NDKEvent[]>();
//         for (const event of events) {
//             map.set(event.pubkey, [...(map.get(event.pubkey) ?? []), event]);
//         }
//         return map;
//     }, [events]);

//     return (
//         <ScrollView horizontal style={{ height: 40 }} className="flex-none">
//             <View className="flex-1 flex-row gap-2 p-2">
//                 {Array.from(eventsMap.entries()).map(([pubkey, events]) => (
//                     <StoryEntry key={pubkey} pubkey={pubkey} events={events} />
//                 ))}
//             </View>
//         </ScrollView>
//     );
// }

function DataList({ feedType }: { feedType: string }) {
    const currentUser = useNDKCurrentUser();
    const { ndk } = useNDK();
    const follows = useFollows();
    const muteList = useMuteList();
    const includeTweets = useAtomValue(includeTweetsAtom);

    const scrollRef = useRef(null);
    const setHomeScreenScrollRef = useSetAtom(homeScreenScrollRefAtom);

    useEffect(() => {
        if (scrollRef.current) {
            setHomeScreenScrollRef(scrollRef.current);
        }
    }, [scrollRef.current]);

    useEffect(() => {
        // go through the mute list and remove the events from the event map
        for (const [id, event] of eventMapRef.current.entries()) {
            if (muteList.has(event.event?.pubkey)) {
                eventMapRef.current.delete(id);
            }
        }
    }, [muteList]);

    useEffect(() => {
        if (feedType === 'follows') {
            const followSet = new Set(follows);
            for (const [id, event] of eventMapRef.current.entries()) {
                if (!followSet.has(event.event?.pubkey)) {
                    eventMapRef.current.delete(id);
                }
            }
        }
    }, [feedType]);

    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const filters = useMemo(() => {
        let relaySet: NDKRelaySet | undefined;

        const followsFilter = feedType === 'follows' && follows?.length > 2 ? { authors: [...follows, currentUser?.pubkey] } : {};

        const filters: NDKFilter[] = [
            // { kinds: [NDKKind.Image, NDKKind.VerticalVideo, NDKKind.HorizontalVideo ], ...followsFilter },
            { kinds: [NDKKind.Image], ...followsFilter },
            { kinds: [NDKKind.Text], '#k': ['20'], ...followsFilter },
            { kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': [NDKKind.Image.toString()], limit: 1, ...followsFilter },
            { kinds: [NDKKind.EventDeletion], '#k': ['20'], ...followsFilter, limit: 50 },
        ];

        if (currentUser) {
            filters.push({ kinds: [NDKKind.EventDeletion], '#k': ['20'], authors: [currentUser.pubkey] });
        }

        if (includeTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50 });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50 });

            relaySet = NDKRelaySet.fromRelayUrls(['wss://relay.olas.app'], ndk);
        }

        if (tagFilter) filters.push({ kinds: [1], '#t': [tagFilter] });

        return filters;
    }, [follows?.length, includeTweets, tagFilter, feedType, currentUser]);

    const opts = useMemo(() => ({ skipVerification: true, groupable: false, wot: false, subId: 'home-feed' }), []);

    const { events } = useSubscribe({ filters, opts });

    type EventWithReposts = { event: NDKEvent | undefined; reposts: NDKEvent[]; timestamp: number };

    const eventIdsRef = useRef<Set<NDKEventId>>(new Set());
    const eventMapRef = useRef<Map<NDKEventId, EventWithReposts | 'deleted'>>(new Map());

    const selectedEvents = useMemo(() => {
        const eventMap = new Map<NDKEventId, EventWithReposts | 'deleted'>(eventMapRef.current);

        const addEvent = (event: NDKEvent) => {
            if (event.kind === NDKKind.GenericRepost) {
                const eventId = event.tagValue('e');

                if (!eventId) return;
                if (!eventMap.has(eventId)) {
                    // add the event to the map
                    try {
                        const payload = JSON.parse(event.content);
                        const originalEvent = new NDKEvent(event.ndk, payload);
                        eventMap.set(eventId, { event: originalEvent, reposts: [event], timestamp: event.created_at });
                    } catch (e) {
                        eventMap.set(eventId, { event: undefined, reposts: [], timestamp: event.created_at });
                    }
                } else {
                    // update the reposts and timestamp
                    const current = eventMap.get(eventId)!;
                    if (current === 'deleted') return;
                    current.reposts.push(event);
                    if (current.timestamp < event.created_at) {
                        // TODO: don't update the timestamp if the event has already been seen (we need a ref to keep track of seen posts)
                        current.timestamp = event.created_at;
                    }
                    eventMap.set(eventId, current);
                }
            } else if (event.kind === NDKKind.EventDeletion) {
                for (const eTag of event.getMatchingTags('e')) {
                    eventMap.set(eTag[1], 'deleted');
                }
            } else {
                eventMap.set(event.id, { event, reposts: [], timestamp: event.created_at });
            }
        };

        for (const event of events) {
            if (eventIdsRef.current.has(event.id)) continue;
            eventIdsRef.current.add(event.id);

            if (
                [NDKKind.HorizontalVideo, NDKKind.VerticalVideo, NDKKind.Image, NDKKind.GenericRepost, NDKKind.EventDeletion].includes(
                    event.kind
                )
            ) {
                addEvent(event);
            }

            if (event.kind === NDKKind.Text) {
                const content = event.content;
                const urlMatch = content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
                if (urlMatch) {
                    addEvent(event);
                }
            }
        }

        eventMapRef.current = eventMap;

        return Array.from(eventMap.values())
            .filter((event) => event !== 'deleted')
            .filter((event) => event.event !== undefined)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [events, muteList]);

    const [title, setTitle] = useAtom(titleAtom);
    const cacheWarmUpSub = useRef<NDKSubscription | null>(null);

    useEffect(() => {
        if (cacheWarmUpSub.current) {
            cacheWarmUpSub.current.stop();
            cacheWarmUpSub.current = null;
        }

        setTitle(selectedEvents.length);
        const eTags = [];
        const aTags = [];
        for (const { event } of selectedEvents) {
            if (!event.isParamReplaceable()) eTags.push(event.tagId());
            else aTags.push(event.tagId());
        }
        const kindsReceived = new Set();
        const filters: NDKFilter[] = [];
        if (eTags.length > 0) filters.push({ '#e': eTags });
        if (aTags.length > 0) filters.push({ '#a': aTags });

        if (filters.length === 0) return;

        cacheWarmUpSub.current = ndk.subscribe(filters, {
            skipVerification: true,
            closeOnEose: false,
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
            groupable: false,
        });
        cacheWarmUpSub.current.on('event', (event) => {
            kindsReceived.add(event.kind);
        });

        return () => {
            cacheWarmUpSub.current?.stop();
            cacheWarmUpSub.current = null;
        };
    }, [selectedEvents.length]);

    const loadUserData = () => {
        // Pick a random tag when refreshing
        const randomTag = randomPhotoTags[Math.floor(Math.random() * randomPhotoTags.length)];
        setTagFilter(randomTag);
    };

    return (
        <View className="flex-1 gap-2 bg-card">
            <FlashList
                ref={scrollRef}
                data={selectedEvents}
                estimatedItemSize={500}
                keyExtractor={(event) => event.event?.id ?? ''}
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadUserData} />}
                scrollEventThrottle={100}
                renderItem={({ item, index }) => <Post event={item.event} reposts={item.reposts} timestamp={item.timestamp} />}
                disableIntervalMomentum={true}
            />

            <PostOptionsMenu />
        </View>
    );
}

function HomeTitle() {
    const [feedType, setFeedType] = useAtom(feedTypeAtom);
    const { colors } = useColorScheme();
    const { ndk } = useNDK();
    const [relays, setRelays] = useState<string[]>([]);
    const sheetRef = useSheetRef();
    const inset = useSafeAreaInsets();

    const showSheet = useCallback(() => {
        if (!ndk) return;
        const connectedRelays = ndk.pool.connectedRelays();
        const connectedRelaysNames = connectedRelays.map((r) => r.url);

        setRelays(connectedRelaysNames);

        sheetRef.current?.present();
    }, [ndk]);

    const feedTypeTitle = useMemo(() => {
        if (feedType === 'follows') return 'Follows';
        if (feedType === 'local') return 'For You';
        return feedType;
    }, [feedType]);

    const [includeTweets, setIncludeTweets] = useAtom(includeTweetsAtom);
    return (
        <>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={showSheet}>
                <Text className="text-xl font-semibold">{feedTypeTitle}</Text>
                <ChevronDown size={16} color={colors.foreground} />
            </Pressable>
            <Sheet ref={sheetRef}>
                <BottomSheetView style={{ padding: 10, paddingBottom: inset.bottom, height: Dimensions.get('window').height * 0.7 }}>
                    <Pressable className="my-4 flex-row items-center gap-4" onPress={() => setIncludeTweets(!includeTweets)}>
                        <Checkbox checked={includeTweets} />
                        <Text className="text-lg font-semibold">Include Tweets</Text>
                    </Pressable>

                    <Text variant="title1">Feed Type</Text>

                    <List
                        variant="full-width"
                        data={[
                            { title: 'Follows', subTitle: 'Posts from people you follow', value: 'follows' },
                            { title: 'For You', subTitle: 'Posts within your network', value: 'local' },
                            { title: 'Bookmarks', subTitle: 'Posts you have bookmarked', onPress: () => router.push('/bookmarks') },
                            ...relays.map((relay) => ({ title: relay, subTitle: relay, value: relay })),
                        ]}
                        estimatedItemSize={50}
                        renderItem={({ item, target, index }) => (
                            <ListItem
                                className={cn(
                                    'ios:pl-0 pl-2',
                                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                                )}
                                titleClassName={cn('text-lg', item.value === feedType && '!font-extrabold')}
                                item={item}
                                index={index}
                                target={target}
                                onPress={() => {
                                    if (item.onPress) item.onPress();
                                    else setFeedType(item.value);
                                    sheetRef.current?.dismiss();
                                }}
                            />
                        )}
                    />
                </BottomSheetView>
            </Sheet>
        </>
    );
}
