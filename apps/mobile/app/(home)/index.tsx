import {
    NDKEventId,
    NDKSubscription,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useNavigation } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';
import { Calendar, ChevronDown, House, Search, UserCircle2, X } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useFollows, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationsButton from '@/components/Headers/Home/NotificationsButton';
import Feed from '@/components/Feed';
import { FlashList } from '@shopify/flash-list';
import { useObserver } from '@/hooks/observer';
import { MediaPreview as PostEditorMediaPreview} from '@/lib/post-editor/components/MediaPreview';

import EventMediaContainer from '@/components/media/event';
import EventContent from '@/components/ui/event/content';
import UserAvatar from '@/components/ui/user/avatar';
import { activeEventAtom } from '@/stores/event';
import { videoKinds } from '@/utils/const';
import { FeedEntry } from '@/components/Feed/hook';
import { FeedType, feedTypeAtom } from '@/components/FeedType/store';
import { useFeedTypeBottomSheet } from '@/components/FeedType/hook';
import { useGroup } from '@/lib/groups/store';
import { usePostEditorStore } from '@/lib/post-editor/store';
import HomeHeader from '@/components/Headers/Home';
import { useIsSavedSearch } from '@/hooks/saved-search';
import { searchQueryAtom } from '@/components/Headers/Home/store';
import { useAllFollows } from '@/hooks/follows';
import { imageOrVideoUrlRegexp } from '@/utils/media';

// const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

function HeaderBackground() {
    const { colors } = useColorScheme();
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.card }} />
        // <LinearGradient
        //     colors={[
        //         '#00000099',
        //         'transparent'
        //     ]}
        //     style={{ flex: 1 }}
        // />
    )
}

export default function HomeScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: false,
                    header: () => <HomeHeader />,
                }}
            />

            <UploadingIndicator />

            <DataList />
        </>
    );
}

function UploadingIndicator() {
    const readyToPublish = usePostEditorStore(s => s.readyToPublish);
    const uploading = usePostEditorStore(s => s.state === 'uploading');
    const metadata = usePostEditorStore(s => s.metadata);
    const uploadError = usePostEditorStore(s => s.error);
    const resetPostEditor = usePostEditorStore(s => s.reset);
    const { colors } = useColorScheme();
    
    if (!readyToPublish) return null;
    
    return (
        <Pressable
            className="border-b border-border"
            style={{ paddingHorizontal: 10, paddingVertical: 5, height: 70, backgroundColor: colors.card, flexDirection: 'row', gap: 10, alignItems: 'center' }}
        >
            <View style={{ height: 60, width: 60, borderRadius: 10, overflow: 'hidden'}}>
                <PostEditorMediaPreview limit={1} withEdit={false} maxWidth={60} maxHeight={60} />
            </View>

            <View className="flex-col items-start flex-1">
                {uploadError ? (
                    <Text className="text-red-500 text-sm">{uploadError}</Text>
                ) : (
                    <Text className="text-lg font-medium">
                        {uploading ? 'Uploading' : 'Publishing'}
                    </Text>
                )}
                <Text variant="caption1" numberOfLines={1} className="text-muted-foreground">{metadata.caption}</Text>
            </View>


            <Button variant="plain" onPress={resetPostEditor}>
                <X size={24} color={colors.foreground} />
            </Button>
        </Pressable>
    )
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
            <UserAvatar pubkey={pTag} userProfile={userProfile} className="w-16 h-16 rounded-full" />
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
            <UserAvatar pubkey={pubkey} userProfile={userProfile} className="w-14 h-14 rounded-full" />
            {isLive && <Text className="text-xs text-white bg-red-500 px-0.5 rounded-lg -translate-y-full">LIVE</Text>}
        </Pressable>
    );
}

function Stories() {
    const currentUser = useNDKCurrentUser();
    const twentyFourHoursAgo = (Date.now() - 600 * 60 * 60 * 1000) / 1000;
    const follows = useAllFollows();
    const storiesFilters: NDKFilter[] | false = currentUser ? [
        { kinds: [30311 as NDKKind], authors: Array.from(follows), since: twentyFourHoursAgo },
        { kinds: [30311 as NDKKind], "#p": Array.from(follows), since: twentyFourHoursAgo }
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

// how many posts does the time window take into account when deciding whether to show repeated unfollowed pubkeys
const FOR_YOU_ROLLING_POST_WINDOW_LENGTH = 10;

// how many times does an unfollowed pubkey need to be shown in the time window for extra posts to be hidden
const FOR_YOU_UNFOLLOWED_POST_THRESHOLD = 2;

function forYouFilter(followSet: Set<string>) {
    let run = 0;
    let unfollowedPubkeysRecentlyShown = [];
    
    return (feedEntry: FeedEntry, index: number) => {
        if (index === 0) {
            unfollowedPubkeysRecentlyShown = [];
            run++;
        }

        if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
        if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false) return false;

        const isFollowed = followSet.has(feedEntry.event?.pubkey);
        if (!isFollowed) {
            // this is an unfollowed pubkey, check if they were recently shown
            const recentTimesThisPubkeyWasShown = unfollowedPubkeysRecentlyShown.filter(p => p === feedEntry.event?.pubkey).length;
            
            if (recentTimesThisPubkeyWasShown >= FOR_YOU_UNFOLLOWED_POST_THRESHOLD) {
                return false;
            }
            
            unfollowedPubkeysRecentlyShown.push(feedEntry.event?.pubkey);

            // trim the time
            if (unfollowedPubkeysRecentlyShown.length > FOR_YOU_ROLLING_POST_WINDOW_LENGTH) {
                unfollowedPubkeysRecentlyShown.shift();
            }
        }
        
        return true;
    }
}

const nip50Relays = ['wss://relay.nostr.band'];

function hashtagSearch(hashtag: string) {
    const hashtagWithoutHash = hashtag.replace(/^#/, '');
    
    return {
        filters: [{ kinds: [NDKKind.Image, NDKKind.VerticalVideo], "#t": [hashtagWithoutHash] }],
        key: 'hashtag-' + hashtag,
        filterFn: null,
        relayUrls: undefined,
    }
}

function textSearch(text: string) {
    return {
        filters: [{ kinds: [NDKKind.Image], "search": text }],
        key: 'search-' + text,
        filterFn: null,
        relayUrls: nip50Relays,
    }
}

function DataList() {
    const feedType = useAtomValue(feedTypeAtom);
    const currentUser = useNDKCurrentUser();
    const follows = useAllFollows();
    const bookmarkIds = useBookmarkIds();

    const withTweets = useMemo(() => feedType.kind === 'search', [feedType.kind])
    const isSavedSearch = useIsSavedSearch();

    const bookmarkIdsForFilter = useMemo(() => {
        if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') return bookmarkIds;
        return [];
    }, [bookmarkIds.length, feedType])

    const followSet = useMemo(() => {
        const set = new Set(follows);
        if (currentUser) set.add(currentUser.pubkey)
        return set;
    }, [currentUser?.pubkey, follows.size])

    const searchQuery = useAtomValue(searchQueryAtom);

    const { filters, key, filterFn, relayUrls } = useMemo(() => {
        let numColumns = 1;
        if (searchQuery) {
            // is a single word?
            if (!searchQuery.includes(' ')) return hashtagSearch(searchQuery);
            else return textSearch(searchQuery);
        }  else if (feedType.kind === 'group') {
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
        
        const keyParts = [currentUser?.pubkey ?? ""];
        if (feedType.kind === 'search') keyParts.push(feedType.hashtags?.join(' '));
        else keyParts.push(feedType.value);

        let hashtagFilter: NDKFilter = {};
        
        if (feedType.kind === 'search') {
            hashtagFilter = { "#t": feedType.hashtags };
            if (!isSavedSearch) numColumns = 3;
        }

        const filters: NDKFilter[] = [];
    
        // filters.push({ kinds: [1] });
        filters.push({ kinds: [NDKKind.Image, NDKKind.VerticalVideo], ...hashtagFilter, limit: 500 });
        filters.push({ kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': ['20'], ...hashtagFilter, limit: 50 });

        if (withTweets) {
            filters.push({ kinds: [1], limit: 50, ...hashtagFilter });
        }

        let filterFn = null;

        if (feedType.kind === 'discover' && feedType.value === 'follows') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
                return followSet.has(feedEntry.event?.pubkey)
            };
        } else if (feedType.kind === 'discover' && feedType.value === 'for-you') {
            filterFn = forYouFilter(followSet);
        } else if (feedType.kind !== 'search') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
                if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false) return false;
                
                const isFollowed = followSet.has(feedEntry.event?.pubkey)
                if (isFollowed) return true;
                if (feedType.kind === 'discover' && feedType.value === 'follows') return false;

                const isVideo = videoKinds.has(feedEntry.event?.kind)

                return !isVideo || isFollowed;
            };
        }

        return {filters, key: keyParts.join(), filterFn, numColumns};
    }, [followSet.size, withTweets, feedType.value, currentUser?.pubkey, bookmarkIdsForFilter.length, isSavedSearch, searchQuery]);

    console.log('filters key', key)

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

    // get the height of the navigation bar using expo-navigation   

    return (
        <View className="flex-1 bg-card">
            <Feed
                // prepend={<View style={firstItemStyle} />}
                // prepend={[<Stories />]}
                filters={filters}
                relayUrls={relayUrls}
                filterKey={key}
                filterFn={filterFn}
                numColumns={1}
            />
        </View>
    );
}

const kind1MustHaveMedia = (feedEntry: FeedEntry) => {
    // if it's a kind 1, make sure we have a URL of an image or video
    if (feedEntry.event?.kind === 1) {
        const imeta = feedEntry.event?.tagValue("imeta");
        if (imeta) return true;
        const matches = feedEntry.event?.content.match(imageOrVideoUrlRegexp);
        return matches !== null;
    } 
}

const videosMustBeFromFollows = (feedEntry: FeedEntry, index: number, followSet: Set<string>) => {
    if (videoKinds.has(feedEntry.event?.kind)) {
        return followSet.has(feedEntry.event?.pubkey);
    }
    return true;
}

type FeedFilterFn = (feedEntry: FeedEntry, index: number, followSet: Set<string>) => boolean;

const feedFilters: Record<string, FeedFilterFn> = {
    kind1MustHaveMedia,
    videosMustBeFromFollows,
}

