import {
    NDKDVMRequest,
    NDKEventId,
    NDKSubscription,
    NDKSubscriptionCacheUsage,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import * as SettingsStore from 'expo-secure-store';
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { Bitcoin, Bolt, Bookmark, Calendar, ChevronDown, CircleDashed, LucideCloudLightning, Trash, Wallet } from 'lucide-react-native';
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
import { useObserver } from '@/hooks/observer';
import Follows from '@/components/icons/follows';
import ForYou from '@/components/icons/for-you';
import Bookmarks from '@/components/icons/bookmarks';
import { formatMoney } from '@/utils/bitcoin';
import { Image } from 'expo-image';
import { Button } from '@/components/nativewindui/Button';
import { IconView } from '@/app/(wallet)/(walletSettings)';
import Lightning from '@/components/icons/lightning';

const includeTweetsAtom = atom(false);

export const feedTypeAtom = atom<'follows' | 'for-you' | 'bookmark-feed' | string>('for-you');

// const currentScrollIndexAtom = atom(0);

// function median(values: number[]) {
//     const sorted = values.sort((a, b) => a - b);
//     const mid = Math.floor(sorted.length / 2);
//     return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
// }

// function average(values: number[]) {
//     return values.reduce((sum, value) => sum + value, 0) / values.length;
// }

const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

export default function HomeScreen() {
    const feedType = useAtomValue(feedTypeAtom);
    const { colors } = useColorScheme();
    const { activeWallet } = useNDKWallet();

    const onWalletPress = useCallback(() => {
        if (activeWallet) router.push('/(wallet)')
        else router.push('/enable-wallet');
    }, [ activeWallet ])

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: false,
                    headerLeft: () => <HomeTitle />,
                    title: '',
                    headerRight: () => <View className="flex-row items-center gap-2">
                        <Pressable
                            className="flex-row items-center"
                            onPress={onWalletPress}
                        >
                            <Lightning size={24} color={colors.foreground} fill={colors.foreground} />
                        </Pressable>
                        
                        <CalendarButton />
                        <NotificationsButton />
                    </View>,
                }}
            />

            <DataList feedType={feedType} />
        </>
    );
}

function CalendarButton() {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const observer = useObserver([
        { kinds: [NDKKind.Image], authors: [ currentUser?.pubkey ], "#t": ["olas365"] }
    ], currentUser?.pubkey || false)

    const press = useCallback(() => {
        router.push('/365')
    }, [])

    const hasEvents = useMemo(() => observer.length > 0, [observer.length])

    if (!hasEvents) return null;
    
    return <Pressable onPress={press}>
        <Calendar size={24} color={colors.foreground} />
    </Pressable>
}

// function StoryEntry({ events }: { events: NDKEvent[] }) {
//     const pTag = events[0].tagValue('p') ?? events[0].pubkey;
//     const { userProfile } = useUserProfile(pTag);
//     const insets = useSafeAreaInsets(); 

//     const [showStory, setShowStory] = useState(false);

//     if (showStory) {
//         return (
//             <Modal
//                 animationType="slide"
//                 transparent={false}
//                 visible={true}
//                 onRequestClose={() => setShowStory(false)}
//             >
//                 <View className="bg-black flex-1 h-screen w-screen flex-col">
//                     <EventMediaContainer
//                         event={event}
//                         muted={false}
//                         loop={false}
//                         onFinished={() => setShowStory(false)}
//                         onPress={(player: VideoPlayer) => {
//                             player.pause();
//                             setShowStory(false);
//                         }}
//                     />

//                     <View className="absolute bottom-0 left-0 right-0 m-4" style={{ paddingBottom: insets.bottom }}>
//                         <EventContent event={events[0]} content={events[0].content} className="text-sm text-white" />
//                     </View>
//                 </View>
//             </Modal>
//         );
//     }

//     return (
//         <Pressable className="flex-row items-center gap-2" onPress={() => {
//             setShowStory(true);
//         }}>
//             <UserAvatar userProfile={userProfile} size={40} className="w-16 h-16 rounded-full" />
//         </Pressable>
//     );
// }


const storiesOpts = { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, closeOnEose: true, skipVerification: true, groupable: false, wrap: true };

// function Stories() {
//     const storiesFilters: NDKFilter[] = useMemo(() => ([{ kinds: [NDKKind.VerticalVideo ], limit: 5 }]), []);
//     const { events } = useSubscribe({ filters: storiesFilters, opts: storiesOpts });
//     const filteredEvents = useMemo(() => {
//         const eventMaps = new Map<Hexpubkey, NDKEvent[]>();
//         for (const event of events) {
//             const pubkey = event.pubkey;
//             if (!eventMaps.has(pubkey)) {
//                 eventMaps.set(pubkey, []);
//             }
//             eventMaps.get(pubkey)!.push(event);
//         }
//         return eventMaps;
//     }, [events]);

//     return (
//         <ScrollView horizontal className="flex-none flex border-b border-border">
//             <View className="flex-1 flex-row gap-2 p-2">
//                 <Text className="text-foreground">Stories {events.length} {filteredEvents.size}</Text>
//                 {Array.from(filteredEvents.entries()).map(([pubkey, events]) => (
//                     <StoryEntry key={pubkey} events={events} />
//                 ))}
//             </View>
//         </ScrollView>
//     );
// }

const bookmarksFilters = [{ kinds: [3006], "#k": ["20"] }];
const bookmarksOpts = { skipVerification: true, groupable: false, wrap: true };
function BookmarksMode() {
    const { events: bookmarks } = useSubscribe({ filters: bookmarksFilters, opts: bookmarksOpts });

    return (
        <View className="flex-1 gap-2 bg-card">
            <Feed
                filters={bookmarksFilters}
                filterKey={key}
            />
        </View>
    );
}

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
            setRet(Array.from(ids));
        });

        sub.current.start();

        return () => {
            sub.current?.stop();
            sub.current = null;
            eosed.current = false;
        }
    }, [ndk, feedType]);

    console.log('bookmark ids', ret.length);

    return ret;
}

function DataList({ feedType }: { feedType: string }) {
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const includeTweets = useAtomValue(includeTweetsAtom);
    const [explicitFeed, setExplicitFeed] = useAtom(explicitFeedAtom);
    const bookmarkIds = useBookmarkIds();

    const withTweets = useMemo(() => includeTweets || feedType.startsWith('#'), [includeTweets, feedType])

    const {filters, key} = useMemo(() => {
        if (feedType === 'bookmark-feed') {
            console.log('bookmark feed with ids', bookmarkIds.length);
            if (bookmarkIds.length === 0) return { filters: [], key: 'empty' };
            return {
                filters: [
                    { ids: bookmarkIds },
                    { "#e": bookmarkIds, kinds: [3006] },
                ], key: 'bookmark-feed'
            };
        }
        
        const keyParts = [feedType, currentUser?.pubkey ?? "", !!includeTweets];
        
        if (feedType === 'follows' && follows && follows?.length > 2) keyParts.push(follows.length.toString())

        const followsFilter = feedType === 'follows' && follows?.length > 2 ? { authors: [...follows, currentUser?.pubkey] } : {};
        const hashtagFilter = feedType.startsWith('#') ? { "#t": [feedType.slice(1, 99)] } : {};

        const filters: NDKFilter[] = [
            { kinds: [NDKKind.Image], ...followsFilter, ...hashtagFilter },
            { kinds: [NDKKind.Text], '#k': ['20'], ...followsFilter, ...hashtagFilter },
            { kinds: [NDKKind.Text], '#k': [NDKKind.Image.toString()], limit: 50, ...followsFilter, ...hashtagFilter },
            { kinds: [NDKKind.EventDeletion], '#k': ['20'], ...followsFilter, limit: 50 },
        ];

        if (!feedType.startsWith('#')) {
            filters.push({
                kinds: [NDKKind.Repost, NDKKind.GenericRepost, 3006], '#k': [NDKKind.Image.toString()], limit: 50, ...followsFilter
            });
        }

        if (currentUser) {
            filters.push({ kinds: [NDKKind.EventDeletion], '#k': ['20'], authors: [currentUser.pubkey] });
        }

        if (withTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50, ...hashtagFilter });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50, ...hashtagFilter });
        }

        return {filters, key: keyParts.join()};
    }, [follows?.length, withTweets, feedType, currentUser?.pubkey]);

    return (
        <View className="flex-1 gap-2 bg-card">
            <Feed
                filters={filters}
                filterKey={key}
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
            { title: '#introductions', subTitle: 'Photography posts', value: '#introductions' },
        ];

        // v.push(...dvms);

        return v;
    }, [follows?.length]);
    
    const setOption = useCallback((value) => {
        setFeedType(value);
        SettingsStore.setItemAsync('feed', value);
        sheetRef.current?.dismiss();
    }, [sheetRef.current, setFeedType])
    
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

                    <View className="flex-row items-stretch gap-4 justify-equal my-4">
                        <Button
                            variant={feedType === 'follows' ? 'tonal' : 'secondary'}
                            className="flex-1 flex-col !py-4"
                            style={{ paddingVertical: 40 }}
                            onPress={() => setOption('follows')}
                        >
                            <Follows stroke={colors.foreground} size={38} />
                            <Text className="text-base text-muted-foreground font-semibold">Follows</Text>
                        </Button>
                        
                        <Button
                            variant={feedType === 'for-you' ? 'tonal' : 'secondary'}
                            className="flex-1 flex-col"
                            onPress={() => setOption('for-you')}
                        >
                            <ForYou stroke={colors.foreground} size={38} />
                            <Text className="text-base text-muted-foreground font-semibold">For You</Text>
                        </Button>

                        <Button
                            variant={feedType === 'bookmark-feed' ? 'tonal' : 'secondary'}
                            className="flex-1 flex-col gap-1"
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
                </BottomSheetView>
            </Sheet>
        </>
    );
}
