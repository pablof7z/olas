import { useSubscribe, useNDK, NDKSubscriptionCacheUsage, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StatusBar, View, ViewToken } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as User from '@/components/ui/user';
import { useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router, usePathname } from 'expo-router';
import EventContent from '@/components/ui/event/content';
import { Image } from 'expo-image';
import { Reactions } from '@/components/events/Post/Reactions';
import { getImetas } from '@/components/media/event';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import RelativeTime from '@/components/relative-time';
import { getClientName } from '@/utils/event';
import { useObserver } from '@/hooks/observer';

const visibleItemAtom = atom<string | null, [string | null], void>(null, (get, set, update) => {
    set(visibleItemAtom, update);
});

const Reel = memo(
    ({ event }: { event: NDKEvent }) => {
        const visibleItem = useAtomValue(visibleItemAtom);
        const isVisible = visibleItem === event.id;
        const [isLoading, setIsLoading] = useState(true);
        const videoRef = useRef<VideoView>(null);
        const { userProfile } = useUserProfile(event.pubkey);
        const safeAreaInsets = useSafeAreaInsets();
        const thumb = event.tagValue('thumb');
        const pathname = usePathname()

        const url = getImetas(event)[0]?.url;
        const videoSource = { uri: url };

        const player = useVideoPlayer(videoSource, (player) => {
            player.loop = true;
            player.muted = false;
            player.addListener('statusChange', (status) => {
                if (player.status === 'readyToPlay') {
                    setIsLoading(false);
                }
            });
        });

        useEffect(() => {
            if (isVisible && pathname === '/reels') {
                player.play();
            } else {
                player.pause();
            }
        }, [player, isVisible, pathname]);

        const clientName = getClientName(event);

        return (
            <View
                style={{
                    flex: 1,
                    width: '100%',
                    height: Dimensions.get('window').height - safeAreaInsets.bottom,
                    backgroundColor: 'black',
                    borderWidth: 1,
                }}>
                {isLoading && (
                    <View
                        style={{
                            flex: 1,
                            width: '100%',
                            height: Dimensions.get('window').height - safeAreaInsets.bottom,
                        }}>
                        <Image
                            source={{ uri: thumb }}
                            style={{ flex: 1, width: '100%', height: '100%' }}
                        />
                        <ActivityIndicator
                            size="large"
                            color="gray"
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

                <VideoView
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        flex: 1,
                        width: '100%',
                        height: Dimensions.get('window').height - safeAreaInsets.bottom,
                    }}
                    contentFit="cover"
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                    nativeControls={false}
                    ref={videoRef}
                />

                <SafeAreaView className="absolute bottom-0 pb-10 left-4 flex-col items-start gap-2">
                    <Reactions
                        event={event}
                        foregroundColor="white"
                        inactiveColor="white"
                    />

                    <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() => router.push(`/profile?pubkey=${event.pubkey}`)}>
                        <User.Avatar
                            pubkey={event.pubkey}
                            userProfile={userProfile}
                            imageSize={48}
                        />
                        <Text className="flex-col text-base font-semibold text-white">
                            <User.Name
                                userProfile={userProfile}
                                pubkey={event.pubkey}
                            />
                            <Text>
                                <RelativeTime
                                    timestamp={event.created_at}
                                    className="text-xs text-muted-foreground"
                                />
                                {clientName && (
                                    <Text
                                        className="truncate text-xs text-muted-foreground"
                                        numberOfLines={1}>
                                        {` via ${clientName}`}
                                    </Text>
                                )}
                            </Text>
                        </Text>
                    </Pressable>
                    <EventContent event={event} className="text-sm text-white" />
                </SafeAreaView>
            </View>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.event.id === nextProps.event.id
        );
    }
);

export default function ReelsScreen() {
    const events = useObserver([{ kinds: [NDKKind.VerticalVideo] }]);
    const safeAreaInsets = useSafeAreaInsets();
    const setVisibleItem = useSetAtom(visibleItemAtom);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length === 0) return;
        const newVisibleItem =
            viewableItems.length > 0 ? viewableItems[0].item.id : null;
        setVisibleItem(newVisibleItem);
    }, [setVisibleItem]);

    const sortedEvents = useMemo(() => {
        return events
            .sort((a, b) => b.created_at! - a.created_at!)
            // ensure one event per pubkey
            .filter((event, index, self) => {
                return (
                    self.findIndex((e) => e.pubkey === event.pubkey) === index
                );
            })
            .filter((event: NDKVideo) => {
                const url = event.imetas?.[0]?.url || event.tagValue('url');
                if (!url) console.log('imetas', event.imetas, 'tags', event.tags);
                return !!url;
            });
    }, [events]);

    const height = Dimensions.get('window').height - safeAreaInsets.bottom;

    return (
        <>
            <StatusBar hidden={true} />
            <View className="flex-1 bg-card">
                <FlashList
                    data={sortedEvents}
                    keyExtractor={(i) => i.id}
                    renderItem={({ item }) => <Reel event={item} />}
                    estimatedItemSize={height}
                    snapToAlignment="start"
                    snapToInterval={height}
                    decelerationRate="fast"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{
                        itemVisiblePercentThreshold: 50,
                    }}
                />
            </View>
        </>
    );
}
