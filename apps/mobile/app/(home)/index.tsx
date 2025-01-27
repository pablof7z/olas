import {
    NDKEventId,
    NDKSubscription,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useNavigation } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';
import { Calendar, ChevronDown, House, UserCircle2, X } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useFollows, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationsButton from '@/components/NotificationsButton';
import Feed from '@/components/Feed';
import { FlashList } from '@shopify/flash-list';
import { useObserver } from '@/hooks/observer';


import EventMediaContainer from '@/components/media/event';
import EventContent from '@/components/ui/event/content';
import UserAvatar from '@/components/ui/user/avatar';
import { activeEventAtom } from '@/stores/event';
import { videoKinds } from '@/utils/const';
import { FeedEntry } from '@/components/Feed/hook';
import { FeedType, feedTypeAtom } from '@/components/FeedType/store';
import { useFeedTypeBottomSheet } from '@/components/FeedType/hook';
import { useGroup } from '@/lib/groups/store';
import { LinearGradient } from 'expo-linear-gradient';
import { metadataAtom, selectedMediaAtom, uploadErrorAtom, uploadingAtom } from '@/components/NewPost/store';
import { MediaPreview } from '@/components/NewPost/MediaPreview';

// const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

function HeaderBackground() {
    return (
        <LinearGradient
            colors={[
                '#00000099',
                'transparent'
            ]}
            style={{ flex: 1 }}
        />
    )
}

export default function HomeScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: false,
                    headerLeft: () => <HomeTitle />,
                    // headerBackground: () => <HeaderBackground />,
                    // headerBackground: () => <BlurView intensity={150} style={{ flex: 1 }} />,
                    title: '',
                    headerRight: () => <View className="flex-row items-center gap-2">
                        {/* <Pressable
                            className="flex-row items-center w-10"
                            onPress={() => router.push('/communities')}
                        >
                            <House />
                        </Pressable> */}
                        
                        <CalendarButton />

                        <NotificationsButton />
                    </View>,
                }}
            />

            <UploadingIndicator />

            <DataList />
        </>
    );
}

function UploadingIndicator() {
    const selectedMedia = useAtomValue(selectedMediaAtom);
    const { colors } = useColorScheme();
    const metadata = useAtomValue(metadataAtom);
    const [uploading, setUploading] = useAtom(uploadingAtom);
    const setSelectedMedia = useSetAtom(selectedMediaAtom);
    const [ uploadError, setUploadError ] = useAtom(uploadErrorAtom);

    const cancel = useCallback(() => {
        setUploading(false);
        setUploadError(null);
        setSelectedMedia([]);
    }, [setUploading, setUploadError, setSelectedMedia]);
    
    if (!selectedMedia.length) return null;
    
    return (
        <Pressable
            onPress={() => router.push('/publish')}
            className="border-b border-border"
            style={{ paddingHorizontal: 10, paddingVertical: 5, height: 70, backgroundColor: colors.card, flexDirection: 'row', gap: 10, alignItems: 'center' }}
        >
            <View style={{ height: 60, width: 60, borderRadius: 10, overflow: 'hidden'}}>
                <MediaPreview assets={selectedMedia} withEdit={false} maxWidth={60} maxHeight={60} />
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


            <Button variant="plain" onPress={cancel}>
                <X size={24} color={colors.foreground} />
            </Button>
        </Pressable>
    )
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
    const insets = useSafeAreaInsets();

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
        
        const keyParts = [currentUser?.pubkey ?? "", feedType.kind === 'hashtag' ? feedType.value : ''];
        
        const hashtagFilter = feedType.kind === 'hashtag' ? { "#t": hashtagFeedToTags(feedType) } : {};

        const filters: NDKFilter[] = [];
    
        filters.push({ kinds: [NDKKind.Image, NDKKind.VerticalVideo], ...hashtagFilter });
        filters.push({ kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': ['20'], ...hashtagFilter });

        // if (withTweets) {
        //     filters.push({ kinds: [1], limit: 50, ...hashtagFilter });
        // }

        let filterFn = null;

        if (feedType.kind !== 'hashtag') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                // if it's a kind 1, make sure we have a URL of an image or video
                if (feedEntry.event?.kind === 1) {
                    const imeta = feedEntry.event?.tagValue("imeta");
                    if (imeta) return true;
                    // parse the content for a URL that has .jpg, .jpeg, .png, .gif, .mp4, .mov, .avi, .mkv
                    const imageOrVideoRegex = /https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif|\.mp4|\.mov|\.avi|\.mkv)/;
                    const matches = feedEntry.event?.content.match(imageOrVideoRegex);
                    return matches !== null;
                } 
                
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

    // get the height of the navigation bar using expo-navigation   
    const headerHeight = useHeaderHeight();
    const { colors } = useColorScheme();
    const firstItemStyle = useMemo(() => ({ paddingTop: headerHeight, backgroundColor: colors.card }), [insets.top, headerHeight])

    return (
        <View className="flex-1 bg-card">
            <Feed
                // prepend={<View style={firstItemStyle} />}
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

    return (
        <>
            <Pressable style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                maxWidth: 150,
                paddingHorizontal: 10,
                justifyContent: 'space-between',
            }} onPress={showSheet}>
                {group ? (
                    <>
                        <Image source={{ uri: group.picture }} style={{ width: 24, height: 24, borderRadius: 4 }} />
                        <Text className="text-xl font-semibold text-foreground truncate">{group.name}</Text>
                    </>) : (<>
                        <Text className="text-xl font-semibold text-foreground truncate">{feedTypeTitle}</Text>
                    </>)
                }
                <ChevronDown size={16} color={colors.foreground} />
            </Pressable>
        </>
    );  
}
