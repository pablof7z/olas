import { useSubscribe, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Post from '@/components/events/Post';
import { useThrottle } from '@uidotdev/usehooks';
import { RefreshControl } from 'react-native-gesture-handler';
import { myFollows } from '@/utils/myfollows';
import { Stack } from 'expo-router';
import { Filter } from 'lucide-react-native';
import { memo } from 'react';
import { DropdownMenu } from '~/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '~/components/nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';
import { useScroll } from '~/contexts/ScrollContext';
import * as User from '@/components/ui/user';
const FilterButton = memo(({ includeTweets, setIncludeTweets }: { includeTweets: boolean; setIncludeTweets: (value: boolean) => void }) => {
    const { colors } = useColorScheme();

    return (
        <DropdownMenu
            items={[
                createDropdownItem({
                    actionKey: 'high-quality',
                    title: 'High-quality content',
                    subTitle: 'High quality posts at a lower velocity',
                    state: { checked: !includeTweets },
                }),
                createDropdownItem({
                    actionKey: 'generic',
                    title: 'Generic content',
                    subTitle: 'Include lower-quality generic content',
                    state: { checked: includeTweets },
                }),
            ]}
            onItemPress={(item) => {
                if (item.actionKey === 'high-quality') setIncludeTweets(false);
                if (item.actionKey === 'generic') setIncludeTweets(true);
            }}>
            <Pressable>
                <Filter size={24} color={colors.foreground} />
            </Pressable>
        </DropdownMenu>
    );
});

const randomPhotoTags = ['photo', 'photography', 'artstr', 'art'];

export default function HomeScreen() {
    const { follows } = useNDKSession();
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [includeTweets, setIncludeTweets] = useState(false);
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [
            { kinds: [20] },
            { kinds: [1], '#k': ['20'] }, // cheating!!!
        ];

        if (includeTweets) {
            if (follows) filters.push({ kinds: [1], authors: follows, limit: 50 });
            else filters.push({ kinds: [1], authors: myFollows, limit: 50 });
        }

        if (tagFilter) filters.push({ kinds: [1], '#t': [tagFilter] });

        return filters;
    }, [follows, includeTweets, tagFilter]);
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

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Home',
                    headerRight: () => <FilterButton includeTweets={includeTweets} setIncludeTweets={setIncludeTweets} />,
                }}
            />
            <View className="flex-1 gap-2 bg-card">
                <FlashList
                    ref={scrollRef}
                    data={debouncedEvents}
                    estimatedItemSize={340}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUserData} />}
                    renderItem={({ item }) => (
                        <User.Profile pubkey={item.pubkey}>
                            <Post event={item} />
                        </User.Profile>
                    )}
                    contentContainerStyle={styles.listContainer}
                />
            </View>
        </>
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
