import { useSubscribe, useNDKSession, useNDK, useUserProfile, NDKEventId } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post, { PostHeader } from '@/components/events/Post';
import { RefreshControl } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { router, Stack } from 'expo-router';
import { useScroll } from '~/contexts/ScrollContext';
import FilterButton from '@/components/FilterButton';
import * as User from '@/components/ui/user';
import NotificationsButton from '@/components/NotificationsButton';
import { Text } from '@/components/nativewindui/Text';
import { ChevronDown, Repeat } from 'lucide-react-native';
import { DropdownMenu } from '@/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '@/components/nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';
import RelativeTime from '@/app/components/relative-time';

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

export default function HomeScreen() {
    const [includeTweets, setIncludeTweets] = useState(false);
    const [feedType, setFeedType] = useState<'follows' | 'local' | string>('local');

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: () =>
                        <HomeTitle feedType={feedType} setFeedType={setFeedType} />,
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
    const { currentUser } = useNDK();
    const { follows } = useNDKSession();
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const scrollRef = useScroll();
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [
            { kinds: [NDKKind.Image] },
            { kinds: [NDKKind.Text], '#k': ['20'] },
            { kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': [NDKKind.Image.toString()] },
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
        }

        if (tagFilter) filters.push({ kinds: [1], '#t': [tagFilter] });

        return filters;
    }, [follows?.length, includeTweets, tagFilter, feedType, currentUser]);
    const opts = useMemo(() => ({
    }), []);
    const { events } = useSubscribe({ filters, opts });

    type EventWithReposts = { event: NDKEvent | undefined, reposts: NDKEvent[], timestamp: number };

    const selectedEvents = useMemo(() => {
        const eventMap = new Map<NDKEventId, EventWithReposts>();

        const addEvent = (event: NDKEvent) => {
            if (event.kind === NDKKind.GenericRepost) {
                const eventId = event.tagValue("e");

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
                    current.reposts.push(event);
                    if (current.timestamp < event.created_at) {
                        // TODO: don't update the timestamp if the event has already been seen (we need a ref to keep track of seen posts)
                        current.timestamp = event.created_at;
                    }
                    eventMap.set(eventId, current);
                }
            }
        }

        const selected: NDKEvent[] = [];
        for (const event of events) {
            if ([NDKKind.HorizontalVideo, NDKKind.VerticalVideo, NDKKind.Image, NDKKind.GenericRepost].includes(event.kind)) {
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

        return Array.from(eventMap.values())
            .filter((event) => event.event !== undefined)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [events]);

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
                keyExtractor={({event}) => event.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadUserData} />}
                renderItem={({ item }) => (
                    <Post event={item.event} reposts={item.reposts} />
                )}
                disableIntervalMomentum={true}
                contentContainerStyle={styles.listContainer}
                />
        </View>
    )
}

function Repost({ event }: { event: NDKEvent }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const originalEvent = useMemo(() => {
        try {
            const payload = JSON.parse(event.content);
            return new NDKEvent(event.ndk, payload);
        } catch (e) {
            console.log('failed to parse repost event', event.rawEvent());
            return null;
        }
    }, [event.id]);

    if (!originalEvent) return null;
    
    return (
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <View className="w-full flex-row items-center justify-between gap-2 p-2">
                <View style={{ flexDirection: 'row', gap: 4}}>
                    <TouchableOpacity
                        onPress={() => {
                             router.push(`/profile?pubkey=${event.pubkey}`);
                    }}>
                        <User.Avatar userProfile={userProfile} size={24} style={{ width: 20, height: 20 }} />
                    </TouchableOpacity>
                    <Repeat size={16} color={'green'} />

                    <View className="flex-col gap-1">
                        <Text className="text-xs text-muted-foreground">
                            {'Reposted '}
                            <RelativeTime timestamp={event.created_at} />
                        </Text>
                    </View>

                    
            </View>
        </View>
            
            
            <Post event={originalEvent} />
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'end' }}>
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
                <Text className="font-medium">
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
