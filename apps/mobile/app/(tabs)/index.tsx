import {
    NDKEventId,
    NDKSubscription,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';
import { Calendar, ChevronDown, House } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useFollows, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationsButton from '@/components/NotificationsButton';
import Feed from '@/components/Feed';
import { FlashList } from '@shopify/flash-list';
import { useObserver } from '@/hooks/observer';

import Lightning from '@/components/icons/lightning';
import { Hexpubkey } from '@nostr-dev-kit/ndk-mobile';
import EventMediaContainer from '@/components/media/event';
import EventContent from '@/components/ui/event/content';
import UserAvatar from '@/components/ui/user/avatar';
import { activeEventAtom } from '@/stores/event';
import { videoKinds } from '@/utils/const';
import { FeedEntry } from '@/components/Feed/hook';
import { FeedType, feedTypeAtom } from '@/components/FeedType/store';
import { useFeedTypeBottomSheet } from '@/components/FeedType/hook';
import { useGroup } from '@/lib/groups/store';

// const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

export default function HomeScreen() {
    const { colors } = useColorScheme();
    const { activeWallet } = useNDKWallet();
    const currentUser = useNDKCurrentUser();

    const onWalletPress = useCallback(() => {
        if (!currentUser?.pubkey) {
            router.push('/login');
            return;
        }
        
        if (activeWallet) router.push('/(wallet)')
        else router.push('/enable-wallet');
    }, [ activeWallet?.walletId, currentUser?.pubkey ])

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: false,
                    headerLeft: () => <HomeTitle />,
                    title: '',
                    headerRight: () => <View className="flex-row items-center gap-2">
                        {/* <Pressable
                            className="flex-row items-center w-10"
                            onPress={() => router.push('/communities')}
                        >
                            <House />
                        </Pressable> */}
                        <Pressable
                            className="flex-row items-center px-2"
                            onPress={onWalletPress}
                        >
                            <Lightning size={24} strokeWidth={2} stroke={colors.foreground} />
                        </Pressable>
                        
                        <CalendarButton />
                        <NotificationsButton />
                    </View>,
                }}
            />

            <DataList />
        </>
    );
}

function CalendarButton() {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const observer = useObserver(currentUser ? [
        { kinds: [NDKKind.Image], authors: [ currentUser.pubkey ], "#t": ["olas365"] }
    ] : false, [currentUser?.pubkey])

    const press = useCallback(() => {
        router.push('/365')
    }, [])

    const hasEvents = useMemo(() => observer.length > 0, [observer.length])

    if (!hasEvents) return null;
    
    return <Pressable onPress={press} className="px-2">
        <Calendar size={24} color={colors.foreground} />
    </Pressable>
}

function StoryEntry({ events }: { events: NDKEvent[] }) {
    const pTag = events[0].tagValue('p') ?? events[0].pubkey;
    const { userProfile } = useUserProfile(pTag);
    const insets = useSafeAreaInsets(); 

    const [showStory, setShowStory] = useState(false);

    if (showStory) {
        return (
            <Modal
                transparent={false}
                visible={true}
                onRequestClose={() => setShowStory(false)}
            >
                <View className="bg-black flex-1 h-screen w-screen flex-col items-center justify-center">
                    <EventMediaContainer
                        singleMode={true}
                        event={events[0]}
                        muted={false}
                        maxWidth={Dimensions.get('window').width}
                        maxHeight={Dimensions.get('window').height}
                        loop={false}
                        onFinished={() => setShowStory(false)}
                        // onPress={(player: VideoPlayer) => {
                        //     player.pause();
                        //     setShowStory(false);
                        // }}
                    />

                    <View className="absolute bottom-0 left-0 right-0 m-4" style={{ paddingBottom: insets.bottom }}>
                        <EventContent event={events[0]} content={events[0].content} className="text-sm text-white" />
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Pressable className="flex-row items-center gap-2" onPress={() => {
            setShowStory(true);
        }}>
            <UserAvatar userProfile={userProfile} size={40} className="w-16 h-16 rounded-full" />
        </Pressable>
    );
}


function LiveViewEntry({ event }: { event: NDKEvent }) {
    const setActiveEvent = useSetAtom(activeEventAtom);
    const pubkey = event.tagValue("p") ?? event.pubkey;
    const { userProfile } = useUserProfile(pubkey);
    const isLive = event.tagValue("status") === "live";
    
    return (
        <Pressable className="flex-col items-center gap-2 px-2" onPress={() => {
            setActiveEvent(event);
            router.push('/live')
        }}>
            <UserAvatar userProfile={userProfile} size={40} className="w-14 h-14 rounded-full" />
            {isLive && <Text className="text-xs text-white bg-red-500 px-0.5 rounded-lg -translate-y-full">LIVE</Text>}
        </Pressable>
    );
}

function Stories() {
    const currentUser = useNDKCurrentUser();
    const twentyFourHoursAgo = (Date.now() - 600 * 60 * 60 * 1000) / 1000;
    const follows = useFollows();
    const storiesFilters: NDKFilter[] | false = currentUser ? [
        { kinds: [30311 as NDKKind], authors: follows, since: twentyFourHoursAgo },
        { kinds: [30311 as NDKKind], "#p": follows, since: twentyFourHoursAgo }
    ] : false;

    // const storiesFilters: NDKFilter[] = useMemo(() => ([
    //     { kinds: [NDKKind.VerticalVideo], since: twentyFourHoursAgo, authors: follows }
    // ]), [follows?.length]);
    const { events } = useSubscribe(storiesFilters, {
        closeOnEose: true,
        skipVerification: true,
        groupable: false,
        wrap: true,
        cacheUnconstrainFilter: []
    });
    // const filteredEvents = useMemo(() => {
    //     const eventMaps = new Map<Hexpubkey, NDKEvent[]>();
    //     for (const event of events) {
    //         const pubkey = event.pubkey;
    //         if (!eventMaps.has(pubkey)) {
    //             eventMaps.set(pubkey, []);
    //         }
    //         eventMaps.get(pubkey)!.push(event);
    //     }
    //     return eventMaps;
    // }, [events]);

    const filtered = useMemo(() => {
        const e = new Map<NDKEventId, NDKEvent>();
        for (const event of events) {
            // if (event.tagValue("status") === "live") {
                e.set(event.id, event);
                console.log(event.id);
            // }
        }
        return Array.from(e.values());
    }, [events, follows]);

    return (
        <View className="flex-row" style={{ height: 70 }}>
            <FlashList
                data={filtered}
                horizontal
                estimatedItemSize={100}
                keyExtractor={(event) => event.id}
                renderItem={({item, index, target}) => (
                    <LiveViewEntry event={item} />
                )}
            />
        </View>
            // horizontal className="flex-none flex border-b border-border">
            // <View className="flex-1 flex-row gap-4 p-2">
            //     {Array.from(filteredEvents.entries()).map(([pubkey, events]) => (
            //         <StoryEntry key={pubkey} events={events} />
            //     ))}
            // </View>
    );
}

const bookmarksFilters = [{ kinds: [3006], "#k": ["20"] }];
const bookmarksOpts = { skipVerification: true, groupable: false, wrap: true };

function useBookmarkIds() {
    const { ndk } = useNDK();
    const sub = useRef<NDKSubscription | null>(null);
    const ids = new Set<string>();
    const eosed = useRef(false);
    const feedType = useAtomValue(feedTypeAtom);
    const [ret, setRet] = useState<NDKEventId[]>([]);

    useEffect(() => {
        if (!ndk) return;
        if (feedType.value !== 'bookmark-feed') {
            sub.current?.stop();
            sub.current = null;
            eosed.current = false;
            return;
        }

        if (sub.current) return;
        
        sub.current = ndk.subscribe(bookmarksFilters, bookmarksOpts, undefined, false);
        
        sub.current.on("event", (event) => {
            if (event.kind !== 3006) return;
            for (const tag of event.getMatchingTags("e")) {
                ids.add(tag[1]);
            }

            if (eosed.current) {
                setRet(Array.from(ids));
            }
        });
    
        sub.current.on("eose", () => {
            eosed.current = true;
            setRet(Array.from(ids));
        });

        sub.current.start();

        return () => {
            sub.current?.stop();
            sub.current = null;
            eosed.current = false;
        }
    }, [ndk, feedType]);

    return ret;
}

function hashtagFeedToTags(feedType: FeedType) {
    switch (feedType.value) {
        case '#photography': return ['photography', 'photo', 'circunvagar'];
        case '#introductions': return ['introductions'];
        case '#family': return ['family', 'kids', 'parenting'];
        case '#travel': return ['travel', 'explore'];
        case '#nature': return ['nature', 'beach', 'mountains', 'forest', 'animals', 'wildlife'];
        case '#memes': return ['memes'];
        case '#art': return ['art', 'artstr', 'aiart', 'circunvagar'];
        case '#music': return ['music', 'jitterbug'];
        case '#food': return ['food', 'foodstr'];
        default:
            return [feedType.value.slice(1, 99)];
    }
}

function DataList() {
    const feedType = useAtomValue(feedTypeAtom);
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const bookmarkIds = useBookmarkIds();

    const withTweets = useMemo(() => feedType.kind === 'hashtag', [feedType.kind])

    const bookmarkIdsForFilter = useMemo(() => {
        if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') return bookmarkIds;
        return [];
    }, [bookmarkIds.length, feedType])

    const followSet = useMemo(() => {
        const set = new Set(follows);
        if (currentUser) set.add(currentUser.pubkey)
        return set;
    }, [currentUser?.pubkey, follows?.length])

    const { filters, key, filterFn, relayUrls } = useMemo(() => {
        if (feedType.kind === 'group') {
            return {
                filters: [
                    { kinds: [NDKKind.Image, NDKKind.VerticalVideo], "#h": [feedType.value] },
                ],
                key: 'groups-' + feedType.value,
                filterFn: null,
                relayUrls: feedType.relayUrls
            }
        } else if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') {
            if (bookmarkIdsForFilter.length === 0) return { filters: undefined, key: 'empty' };
            return {
                filters: [ { ids: bookmarkIdsForFilter } ], key: 'bookmark-feed'+bookmarkIdsForFilter.length
            };
        }
        
        const keyParts = [currentUser?.pubkey ?? "", feedType.value, feedType.kind === 'hashtag'];
        
        if (feedType.kind === 'discover' && feedType.value === 'follows' && follows && follows?.length > 2) keyParts.push(follows.length.toString())

        const hashtagFilter = feedType.kind === 'hashtag' ? { "#t": hashtagFeedToTags(feedType) } : {};

        const filters: NDKFilter[] = [];
    
        filters.push({ kinds: [NDKKind.Image, NDKKind.VerticalVideo], ...hashtagFilter });
        filters.push({ kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': ['20'], ...hashtagFilter });

        if (withTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50, ...hashtagFilter });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50, ...hashtagFilter });
        }

        let filterFn = null;

        if (feedType.kind !== 'hashtag') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                const isFollowed = followSet.has(feedEntry.event?.pubkey)
                if (isFollowed) return true;
                if (feedType.kind === 'discover' && feedType.value === 'follows') return false;

                const isVideo = videoKinds.has(feedEntry.event?.kind)

                return !isVideo || isFollowed;
            };
        }

        return {filters, key: keyParts.join(), filterFn};
    }, [followSet.size, withTweets, feedType.value, currentUser?.pubkey, bookmarkIdsForFilter.length]);

    // useEffect(() => {
    //     // go through the filters, if there is an author tag, count how many elements it has and add it to the array
    //     // if there is no author tag, add 0

    //     const authorCountPerFilter = filters.map((filter) => {
    //         const authorTag = filter.authors;
    //         if (authorTag) return authorTag.length;
    //         return 0;
    //     });
    //     console.log('filters', JSON.stringify(authorCountPerFilter, null, 4), key);
    // }, [filters, key])

    return (
        <View className="flex-1 bg-card">
            <Feed
                // prepend={[<Stories />]}
                filters={filters}
                relayUrls={relayUrls}
                filterKey={key}
                filterFn={filterFn}
            />
        </View>
    );
}

function HomeTitle() {
    const feedType = useAtomValue(feedTypeAtom);
    const { colors } = useColorScheme();
    const { show: showSheet } = useFeedTypeBottomSheet();
    const group = useGroup(feedType.kind === 'group' ? feedType.value : undefined, feedType.kind === 'group' ? feedType.relayUrls[0] : undefined);

    const feedTypeTitle = useMemo(() => {
        if (feedType.kind === 'discover' && feedType.value === 'follows') return 'Follows';
        if (feedType.kind === 'discover' && feedType.value === 'for-you') return 'For You';
        if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') return 'Bookmarks';
        return feedType.value;
    }, [feedType]);

    // const [dvms, setDvms] = useState([]);
    // const setExplicitFeed = useSetAtom(explicitFeedAtom);

    // useEffect(() => {
    //     ndk.fetchEvents([
    //         { kinds: [NDKKind.AppHandler], "#k": ["5300"] }
    //     ]).then((events) => {
    //         const v = [];
    //         events.forEach((event) => {
    //             try {
    //                 const payload = JSON.parse(event.content) as { name: string, about: string, picture: string };
    //                 v.push({
    //                     title: payload.name,
    //                     subTitle: payload.about,
    //                     icon: payload.picture,
    //                     value: payload.name,
    //                     onPress: async () => {
    //                         const e = new NDKDVMRequest(ndk);
    //                         e.dvm = event.author;
    //                         e.kind = 5300;
    //                         e.tags.push(["relays", "wss://relay.primal.net"])
    //                         await e.sign();
    //                         e.publish();
    //                         setFeedType(payload.name);

    //                         const sub = ndk.subscribe([
    //                             { ...e.filter(), authors: [event.pubkey] }
    //                         ]);
    //                         sub.on("event", (response) => {
    //                             if (response.kind !== 6300) return;
    //                             console.log(response);
    //                             sub.stop();
    //                             sheetRef.current?.dismiss();

    //                             try {
    //                                 const res = JSON.parse(response.content)
    //                                 const ids = [];
    //                                 res.forEach((tag) => ids.push(tag[1]));
    //                                 setExplicitFeed([{ ids }]);
    //                             } catch (e) {
    //                                 console.error(e);
    //                             }
    //                         });
    //                     }
    //                 });
    //             } catch (e) {
    //                 console.error(e);
    //             }
    //         });

    //         setDvms(v);
    //     });
    // }, []);

    return (
        <>
            <Pressable style={{ paddingLeft: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={showSheet}>
                {group ? (
                    <>
                        <Image source={{ uri: group.picture }} style={{ width: 24, height: 24, borderRadius: 4 }} />
                        <Text className="text-xl font-semibold">{group.name}</Text>
                    </>) : (<>
                        <Text className="text-xl font-semibold">{feedTypeTitle}</Text>
                    </>)
                }
                <ChevronDown size={16} color={colors.foreground} />
            </Pressable>
        </>
    );
}
