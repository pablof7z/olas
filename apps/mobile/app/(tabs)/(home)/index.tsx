import { useNDK, useSubscribe } from '@/ndk-expo';
import {
    NDKEvent,
    NDKFilter,
    NDKKind,
    NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk';
import { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import WelcomeConsentScreen from '../../welcome';
import { FlashList } from '@shopify/flash-list';
import ImageCard from '@/components/events/ImageCard';
import { useNDKSession } from '@/ndk-expo/hooks/session';
import { useDebounce, useThrottle } from '@uidotdev/usehooks';
import { RefreshControl } from 'react-native-gesture-handler';
import { UserProfileProvider } from '@/ndk-expo/components/user/profile';
import { myFollows } from '@/utils/myfollows';
import { Stack } from 'expo-router';
import { Filter } from 'lucide-react-native';
import { List, ListItem } from '@/components/nativewindui/List';
import { memo } from 'react';

// const FilterButton = memo(({ includeTweets, setIncludeTweets }: { includeTweets: boolean; setIncludeTweets: (value: boolean) => void }) => {
//     // ref
//     const bottomSheetModalRef = useRef<BottomSheetModal>(null);

//     // memoize data
//     const data = useMemo(
//         () => [
//             {
//                 id: 1,
//                 title: 'Photos & videos',
//                 subTitle: 'Include only content that has been posted as a photo or video',
//                 selected: !includeTweets,
//                 onPress: () => {
//                     setIncludeTweets(false);
//                     bottomSheetModalRef.current?.dismiss();
//                 },
//             },
//             {
//                 id: 2,
//                 title: 'Include notes',
//                 subTitle: 'Include generic short notes, higher velocity, lower quality',
//                 selected: includeTweets,
//                 onPress: () => {
//                     setIncludeTweets(true);
//                     bottomSheetModalRef.current?.dismiss();
//                 },
//             },
//         ],
//         [includeTweets]
//     );

//     // memoize render item callback
//     const renderItem = useCallback(({ item, index, target }) => {
//         return <ListItem item={item} index={index} target={target} onPress={item.onPress} />;
//     }, []);

//     // memoize key extractor
//     const keyExtractor = (item) => item.id.toString();

//     // callbacks
//     const handlePresentModalPress = useCallback(() => {
//         bottomSheetModalRef.current?.snapToPosition(100);
//         bottomSheetModalRef.current?.present();
//     }, []);

//     return (
//         <>
//             <Pressable onPress={handlePresentModalPress}>
//                 <Filter size={24} />
//             </Pressable>

//             <BottomSheetModal ref={bottomSheetModalRef}>
//                 <BottomSheetView style={styles.contentContainer}>
//                     <View className="h-full w-full">
//                         <List
//                             variant="insets"
//                             keyExtractor={keyExtractor}
//                             estimatedItemSize={50}
//                             data={data}
//                             contentContainerClassName="pt-4"
//                             contentInsetAdjustmentBehavior="automatic"
//                             renderItem={renderItem}
//                         />
//                     </View>
//                 </BottomSheetView>
//             </BottomSheetModal>
//         </>
//     );
// });

const randomPhotoTags = ['photo', 'photography', 'artstr'];

export default function HomeScreen() {
    const { follows } = useNDKSession();
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [includeTweets, setIncludeTweets] = useState(false);
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [{ kinds: [20] }];

        if (includeTweets) {
            if (follows)
                filters.push({ kinds: [1], authors: follows, limit: 50 });
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
            if (
                [NDKKind.HorizontalVideo, NDKKind.VerticalVideo, 20].includes(
                    event.kind
                )
            ) {
                selected.push(event);
            }

            if (event.kind === NDKKind.Text) {
                const content = event.content;
                const urlMatch = content.match(
                    /https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i
                );
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
        const randomTag =
            randomPhotoTags[Math.floor(Math.random() * randomPhotoTags.length)];
        setTagFilter(randomTag);
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Home',
                    // headerRight: () => <FilterButton includeTweets={includeTweets} setIncludeTweets={setIncludeTweets} />,
                }}
            />
            <View className="flex-1 gap-2 bg-card">
                <FlashList
                    data={debouncedEvents}
                    estimatedItemSize={340}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={loadUserData}
                        />
                    }
                    renderItem={({ item }) => (
                        <UserProfileProvider pubkey={item.pubkey}>
                            <ImageCard event={item} />
                        </UserProfileProvider>
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
