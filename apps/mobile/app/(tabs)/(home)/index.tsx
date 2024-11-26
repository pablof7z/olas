import { useSubscribe, useNDKSession, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post from '@/components/events/Post';
import { useThrottle } from '@uidotdev/usehooks';
import { RefreshControl } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { Stack } from 'expo-router';
import { useScroll } from '~/contexts/ScrollContext';
import * as User from '@/components/ui/user';
import FilterButton from '@/components/FilterButton';
import NotificationsButton from '@/components/NotificationsButton';
import { Text } from '@/components/nativewindui/Text';
import { ChevronDown } from 'lucide-react-native';
import { DropdownMenu } from '@/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '@/components/nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

export default function HomeScreen() {
    const { follows } = useNDKSession();
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [includeTweets, setIncludeTweets] = useState(false);
    const [feedType, setFeedType] = useState<'follows' | 'local' | string>('follows');
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [
            { kinds: [20] },
            { kinds: [1], '#k': ['20'] }, // cheating!!!
        ];

        if (feedType === 'follows') {
            filters[0].authors = follows;
            filters[1].authors = follows;
        }

        if (includeTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50 });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50 });
        }

        if (tagFilter) filters.push({ kinds: [1], '#t': [tagFilter] });

        return filters;
    }, [follows, includeTweets, tagFilter, feedType]);
    const opts = useMemo(() => ({}), []);
    const { events } = useSubscribe({ filters, opts });

    const selectedEvents = useMemo(() => {
        const selected: NDKEvent[] = [];
        for (const event of events) {
            if ([NDKKind.HorizontalVideo, NDKKind.VerticalVideo, 20].includes(event.kind)) {
                selected.push(event);
            }

            if (event.kind === NDKKind.Text) {
                const content = event.content;
                const urlMatch = content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
                if (urlMatch) {
                    selected.push(event);
                }
            }
        }

        // sort by created at
        selected.sort((a, b) => b.created_at - a.created_at).slice(0, 100);

        return selected;
    }, [events]);

    const debouncedEvents = useThrottle(selectedEvents, 100);

    const [refreshing, setRefreshing] = useState(false);

    const loadUserData = () => {
        // Pick a random tag when refreshing
        const randomTag = randomPhotoTags[Math.floor(Math.random() * randomPhotoTags.length)];
        setTagFilter(randomTag);
    };

    const scrollRef = useScroll();

    const renderItem = useMemo(() => ({ item }: { item: NDKEvent }) => (
        <User.Profile pubkey={item.pubkey}>
            <Post event={item} />
        </User.Profile>
    ), []);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: () => <HomeTitle feedType={feedType} setFeedType={setFeedType} />,
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <FilterButton includeTweets={includeTweets} setIncludeTweets={setIncludeTweets} />
                            <NotificationsButton />
                        </View>
                    ),
                }}
            />
            <View className="flex-1 gap-2 bg-card">
                <FlashList
                    ref={scrollRef}
                    data={debouncedEvents}
                    estimatedItemSize={340}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUserData} />}
                    renderItem={renderItem}
                    disableIntervalMomentum={true}
                    contentContainerStyle={styles.listContainer}
                    />
            </View>
        </>
    );
}

function HomeTitle({ feedType, setFeedType }: { feedType: string; setFeedType: (feedType: string) => void }) {
    const { colors } = useColorScheme();
    const { ndk } = useNDK();
    const [i, setI] = useState(0);

    ndk.pool.on('relay:ready', () => setI(i + 1));
    ndk.pool.on('relay:disconnect', () => setI(i - 1));

    const relays = useMemo(() => ndk.pool.connectedRelays().map((r) => r.url), [ndk, i]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: colors.card }}>
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
                    {feedType === 'follows' ? 'Follows' : 'Global'}
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
        paddingBottom: 20,
    },
});
