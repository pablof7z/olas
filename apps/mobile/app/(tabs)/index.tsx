import {
    NDKEventId,
    NDKSubscription,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as SettingsStore from 'expo-secure-store';
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useFollows, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import NotificationsButton from '@/components/NotificationsButton';
import { Checkbox } from '@/components/nativewindui/Checkbox';
import Feed from '@/components/Feed';
import { FlashList } from '@shopify/flash-list';
import { useObserver } from '@/hooks/observer';
import Follows from '@/components/icons/follows';
import ForYou from '@/components/icons/for-you';
import Bookmarks from '@/components/icons/bookmarks';
import { Image } from 'expo-image';
import { Button } from '@/components/nativewindui/Button';
import { IconView } from '@/app/(wallet)/(walletSettings)';
import Lightning from '@/components/icons/lightning';
import { Hexpubkey } from '@nostr-dev-kit/ndk';
import EventMediaContainer from '@/components/media/event';
import EventContent from '@/components/ui/event/content';
import UserAvatar from '@/components/ui/user/avatar';
import { NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import { activeEventAtom } from '@/stores/event';
import { videoKinds } from '@/utils/const';
import { FeedEntry } from '@/components/Feed/hook';

const includeTweetsAtom = atom(false);

export const feedTypeAtom = atom<'follows' | 'for-you' | 'bookmark-feed' | string>('for-you');

// const currentScrollIndexAtom = atom(0);

const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

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


function LiveViewEntry({ event }) {
    const setActiveEvent = useSetAtom(activeEventAtom);
    const pubkey = event.tagValue("p") ?? event.pubkey;
    const { userProfile } = useUserProfile(pubkey);
    const isLive = event.tagValue("status") === "live";
    
    return (
        <Pressable className="flex-col items-center gap-2 px-2" onPress={() => {
            setActiveEvent(event);
            console.log(JSON.stringify(event.rawEvent(), null, 4));
            router.push('/live')
        }}>
            <UserAvatar userProfile={userProfile} size={40} className="w-14 h-14 rounded-full" />
            {isLive && <Text className="text-xs text-white bg-red-500 px-0.5 rounded-lg -translate-y-full">LIVE</Text>}
        </Pressable>
    );
}

function Stories({ follows }: { follows: false | Hexpubkey[] }) {
    const twentyFourHoursAgo = (Date.now() - 600 * 60 * 60 * 1000) / 1000;
    const storiesFilters: NDKFilter[] | false = follows ? [{ kinds: [30311 as NDKKind], authors: follows, since: twentyFourHoursAgo }] : false;

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
            if (event.tagValue("status") === "live") {
                e.set(event.id, event);
                console.log(event.id);
            }
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
        if (feedType !== 'bookmark-feed') {
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
            console.log('eose', ids.size);
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

function hashtagFeedToTags(feedType: string) {
    switch (feedType) {
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
            return [feedType.slice(1, 99)];
    }
}

function DataList() {
    const feedType = useAtomValue(feedTypeAtom);
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const includeTweets = useAtomValue(includeTweetsAtom);
    const bookmarkIds = useBookmarkIds();

    const withTweets = useMemo(() => includeTweets || feedType.startsWith('#'), [includeTweets, feedType])

    const bookmarkIdsForFilter = useMemo(() => {
        if (feedType === 'bookmark-feed') return bookmarkIds;
        return [];
    }, [bookmarkIds.length, feedType])

    const {filters, key} = useMemo(() => {
        if (feedType === 'bookmark-feed') {
            if (bookmarkIdsForFilter.length === 0) return { filters: undefined, key: 'empty' };
            return {
                filters: [ { ids: bookmarkIdsForFilter } ], key: 'bookmark-feed'+bookmarkIdsForFilter.length
            };
        }
        
        const keyParts = [currentUser?.pubkey ?? "", !!includeTweets, !!feedType.startsWith('#')];
        
        if (feedType === 'follows' && follows && follows?.length > 2) keyParts.push(follows.length.toString())

        const hashtagFilter = feedType.startsWith('#') ? { "#t": hashtagFeedToTags(feedType) } : {};

        const filters: NDKFilter[] = [];
    
        filters.push({ kinds: [NDKKind.Image, NDKKind.VerticalVideo], ...hashtagFilter });
        filters.push({ kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': ['20'], ...hashtagFilter });

        // if (!feedType.startsWith('#')) {
        //     filters.push({
        //         kinds: [NDKKind.Repost, NDKKind.GenericRepost, 3006], '#k': [NDKKind.Image.toString()], limit: 50, ...followsFilter
        //     });
        // }

        if (currentUser) {
            filters.push({ kinds: [NDKKind.EventDeletion], '#k': ['20'], authors: [currentUser.pubkey] });
        }

        if (withTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50, ...hashtagFilter });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50, ...hashtagFilter });
        }

        return {filters, key: keyParts.join()};
    }, [follows?.length, withTweets, feedType, currentUser?.pubkey, bookmarkIdsForFilter.length]);

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

    const followSet = useMemo(() => {
        const set = new Set(follows);
        if (currentUser) set.add(currentUser.pubkey)
        return set;
    }, [currentUser?.pubkey, follows?.length])

    const filterFn = useMemo(() => {
        if (feedType.startsWith('#')) return null;

        return (feedEntry: FeedEntry, index: number) => {
            const isFollowed = followSet.has(feedEntry.event?.pubkey)
            if (isFollowed) return true;
            if (feedType === 'follows') return false;

            const isVideo = videoKinds.has(feedEntry.event?.kind)

            return !isVideo || isFollowed;
        };
    }, [ feedType, followSet.size ])
    
    return (
        <View className="flex-1 bg-card">
            <Feed
                // prepend={[<Stories follows={followsForFilter} />]}
                filters={filters}
                filterKey={key}
                filterByFollows={feedType === 'follows'}
                filterFn={filterFn}
            />
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
        if (feedType === 'for-you') return 'For You';
        if (feedType === 'bookmark-feed') return 'Bookmarks';
        return feedType;
    }, [feedType]);

    const [includeTweets, setIncludeTweets] = useAtom(includeTweetsAtom);
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

    const follows = useFollows();
    const listOptions = useMemo(() => {
        const v = [
            {
                title: 'Bookmarks', subTitle: 'Posts you have bookmarked', onPress: () => router.push('/bookmarks'),
                leftView: <IconView name="bookmark" className="bg-orange-500" size={35} />
            },
            { title: '#olas365', subTitle: '#olas365 challenge posts', value: '#olas365' },
            { title: '#photography', subTitle: 'Photography posts', value: '#photography' },
            { title: '#food', subTitle: 'Food posts', value: '#food' },
            { title: '#family', subTitle: 'Family posts', value: '#family' },
            { title: '#art', subTitle: 'Art posts', value: '#art' },
            { title: '#music', subTitle: 'Music posts', value: '#music' },
            { title: '#nature', subTitle: 'Nature posts', value: '#nature' },
            { title: '#travel', subTitle: 'Travel posts', value: '#travel' },
            { title: '#memes', subTitle: 'Memes posts', value: '#memes' },
        ];

        // v.push(...dvms);

        return v;
    }, [follows?.length]);
    
    const setOption = useCallback((value) => {
        sheetRef.current?.dismiss();
        setFeedType(value);
        SettingsStore.setItemAsync('feed', value);
    }, [sheetRef.current, setFeedType])

    const buttonWidth = Dimensions.get('window').width / 3 - 15;
    
    return (
        <>
            <Pressable style={{ paddingLeft: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={showSheet}>
                <Text className="text-xl font-semibold">{feedTypeTitle}</Text>
                <ChevronDown size={16} color={colors.foreground} />
            </Pressable>
            <Sheet snapPoints={['80%']} ref={sheetRef}>
                <BottomSheetView style={{ padding: 10, paddingBottom: inset.bottom, flex: 1 }}>
                    <Text variant="title1">Feed Type</Text>

                    <View className="flex-row gap-1 justify-between my-4 min-h-24">
                        <Button
                            variant={feedType === 'follows' ? 'tonal' : 'secondary'}
                            size="none"
                            className="flex-1 flex-col !py-2"
                            style={{ paddingVertical: 20, width: buttonWidth }}
                            onPress={() => setOption('follows')}
                        >
                            <Follows stroke={colors.foreground} size={38} />
                            <Text className="text-base text-muted-foreground font-semibold">Follows</Text>
                        </Button>
                        
                        <Button
                            variant={feedType === 'for-you' ? 'tonal' : 'secondary'}
                            size="none"
                            className="flex-1 flex-col"
                            style={{ paddingVertical: 20, width: buttonWidth }}
                            onPress={() => setOption('for-you')}
                        >
                            <ForYou stroke={colors.foreground} size={38} />
                            <Text className="text-base text-muted-foreground font-semibold">For You</Text>
                        </Button>

                        <Button
                            variant={feedType === 'bookmark-feed' ? 'tonal' : 'secondary'}
                            size="none"
                            className="flex-1 flex-col gap-1"
                            style={{ paddingVertical: 20, width: buttonWidth }}
                            onPress={() => setOption('bookmark-feed')}
                        >
                            <Bookmarks stroke={colors.foreground} size={38} />
                            <Text className="text-base text-muted-foreground font-semibold">Bookmarks</Text>
                        </Button>
                    </View>

                    <List
                        variant="full-width"
                        data={listOptions}
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
                                leftView={
                                    item.icon ? (
                                        <Image source={item.icon} style={{ width: 48, height: 48, borderRadius: 18, marginRight: 10 }} />
                                    ) : item.leftView ? item.leftView : null
                                }
                                onPress={() => {
                                    if (item.onPress) item.onPress();
                                    else setOption(item.value)
                                }}
                            />
                        )}
                    />

                    <Pressable className="my-4 flex-row items-center gap-4" onPress={() => setIncludeTweets(!includeTweets)}>
                        <Checkbox checked={includeTweets} />
                        <Text className="text-lg font-semibold">Include Tweets</Text>
                    </Pressable>
                </BottomSheetView>
            </Sheet>
        </>
    );
}
