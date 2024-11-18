import { useSubscribe } from '@/ndk-expo';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    View,
    ViewToken,
} from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { ResizeMode, Video } from 'expo-av';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import * as User from '@/ndk-expo/components/user';
import { router } from 'expo-router';
import EventContent from '@/ndk-expo/components/event/content';
import { Image } from 'expo-image';
import { memo } from 'react';

const Reel = memo(
    ({ event, isVisible }: { event: NDKEvent; isVisible: boolean }) => {
        const [isLoading, setIsLoading] = useState(true);
        const safeAreaInsets = useSafeAreaInsets();
        const thumb = event.tagValue('thumb');
        const videoRef = useRef<Video>(null);

        console.log('reel url', event.tagValue('url'));

        return (
            <View
                style={{
                    flex: 1,
                    width: '100%',
                    height:
                        Dimensions.get('window').height - safeAreaInsets.bottom,
                    backgroundColor: 'black',
                }}>
                {isLoading && (
                    <View
                        style={{
                            flex: 1,
                            width: '100%',
                            height:
                                Dimensions.get('window').height -
                                safeAreaInsets.bottom,
                        }}>
                        <Image
                            source={{ uri: thumb }}
                            style={{ flex: 1, width: '100%', height: '100%' }}
                        />
                        <ActivityIndicator
                            size="large"
                            color="#000"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />
                    </View>
                )}
                <Video
                    style={{ flex: 1, width: '100%' }}
                    source={{ uri: event.tagValue('url') }}
                    resizeMode={ResizeMode.COVER}
                    useNativeControls={true}
                    shouldPlay={true}
                    isMuted={true}
                    isLooping={true}
                    ref={videoRef}
                    onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded) setIsLoading(false);
                    }}
                />
                <SafeAreaView className="absolute bottom-4 left-4 flex-col items-start gap-2">
                    <User.Profile pubkey={event.pubkey}>
                        <Pressable
                            className="flex-row items-center gap-2"
                            onPress={() =>
                                router.push(`/profile?pubkey=${event.pubkey}`)
                            }>
                            <User.Avatar
                                alt="Profile image"
                                className="h-8 w-8"
                            />
                            <Text className="text-base font-semibold text-white">
                                <User.Name />
                            </Text>
                        </Pressable>
                    </User.Profile>
                    <EventContent
                        event={event}
                        className="text-sm text-white"
                    />
                </SafeAreaView>
            </View>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.isVisible === nextProps.isVisible &&
            prevProps.event.id === nextProps.event.id
        );
    }
);

export default function ReelsScreen() {
    const filters = useMemo(() => [{ kinds: [NDKKind.VerticalVideo] }], []);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: true }), []);
    const { events } = useSubscribe({ filters, opts });
    const safeAreaInsets = useSafeAreaInsets();

    const [visibleItem, setVisibleItem] = useState<string | null>(null);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                // Track the first visible item's ID
                setVisibleItem(viewableItems[0].item.id);
            } else {
                setVisibleItem(null);
            }
        }
    ).current;

    const sortedEvents = useMemo(() => {
        return (
            events
                .sort((a, b) => {
                    return b.created_at! - a.created_at!;
                })
                // make sure no other events are from the same pubkey
                .filter((event, index, self) => {
                    return (
                        self.findIndex((e) => e.pubkey === event.pubkey) ===
                        index
                    );
                })
        );
    }, [events]);

    return (
        <View className="flex-1 bg-card">
            <FlashList
                data={sortedEvents}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <Reel event={item} isVisible={visibleItem === item.id} />
                )}
                estimatedItemSize={
                    Dimensions.get('window').height - safeAreaInsets.bottom
                }
                snapToAlignment="start"
                snapToInterval={
                    Dimensions.get('window').height - safeAreaInsets.bottom
                }
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                }}
            />
        </View>
    );
}
