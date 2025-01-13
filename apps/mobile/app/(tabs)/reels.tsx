import { useSubscribe, useNDK, NDKSubscriptionCacheUsage, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, View, ViewToken } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as User from '@/components/ui/user';
import { useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import EventContent from '@/components/ui/event/content';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Reactions } from '@/components/events/Post/Reactions';
import { getImetas } from '@/components/media/event';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const visibleItemAtom = atom<string>("");

const Reel = memo(
    ({ event }: { event: NDKEvent }) => {
        const visibleItem = useAtomValue(visibleItemAtom);
        const isVisible = visibleItem === event.id;
        const [isLoading, setIsLoading] = useState(true);
        const videoRef = useRef<VideoView>(null);
        const { userProfile } = useUserProfile(event.pubkey);
        const safeAreaInsets = useSafeAreaInsets();
        const thumb = event.tagValue('thumb');

        const url = getImetas(event)[0]?.url;

        const videoSource = { uri: url };

        const player = useVideoPlayer(videoSource, (player) => {
            player.loop = true;
            player.muted = false;
            player.addListener('statusChange', (status) => {
                if (player.status === 'readyToPlay') {
                    // player.play();
                    setIsLoading(false);
                }
            });
        });

        useEffect(() => {
            if (isVisible) {
                player.play();
            } else {
                player.pause();
            }
        }, [player, isVisible]);

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
                            <Image source={{ uri: thumb }} style={{ flex: 1, width: '100%', height: '100%' }} />
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
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flex: 1, width: '100%', height: Dimensions.get('window').height - safeAreaInsets.bottom }}
                    contentFit="cover"
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                    nativeControls={false}
                    ref={videoRef}
                />

                <SafeAreaView className="absolute bottom-0 pb-10 left-4 flex-col items-start gap-2">
                    <Reactions event={event} relatedEvents={[]} foregroundColor="white" mutedColor="white" />
                    
                    <Pressable className="flex-row items-center gap-2" onPress={() => router.push(`/profile?pubkey=${event.pubkey}`)}>
                        <User.Avatar userProfile={userProfile} alt="Profile image" className="h-8 w-8" />
                        <Text className="text-base font-semibold text-white">
                            <User.Name userProfile={userProfile} pubkey={event.pubkey} />
                        </Text>
                    </Pressable>
                    <EventContent event={event} className="text-sm text-white" />
                </SafeAreaView>
            </View>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.isVisible === nextProps.isVisible && prevProps.event.id === nextProps.event.id;
    }
);

const opts = { groupable: false, closeOnEose: false, wrap: true };

export default function ReelsScreen() {
    const filters = useMemo(() => [{ kinds: [NDKKind.VerticalVideo] }], []);
    const { events } = useSubscribe({ filters, opts });
    const safeAreaInsets = useSafeAreaInsets();

    const setVisibleItem = useSetAtom(visibleItemAtom);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const newVisibleItem = viewableItems.length > 0 ? viewableItems[0].item.id : null;
        setVisibleItem((prev) => (prev !== newVisibleItem ? newVisibleItem : prev));
    }).current;

    const sortedEvents = useMemo(() => {
        return (
            events
                .sort((a, b) => {
                    return b.created_at! - a.created_at!;
                })
                // make sure no other events are from the same pubkey
                .filter((event, index, self) => {
                    return self.findIndex((e) => e.pubkey === event.pubkey) === index;
                })
                .filter((event: NDKVideo) => {
                    const url = event.imetas?.[0]?.url || event.tagValue('url')
                    if (!url) console.log('imetas', event.imetas, 'tags', event.tags)
                    return !!url;
                })
        );
    }, [events]);

    console.log('reel count', events.length, sortedEvents.length)

    return (
        <View className="flex-1 bg-card">
            <FlashList
                data={sortedEvents}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => <Reel event={item} />}
                estimatedItemSize={Dimensions.get('window').height - safeAreaInsets.bottom}
                snapToAlignment="start"
                snapToInterval={Dimensions.get('window').height - safeAreaInsets.bottom}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                }}
            />
        </View>
    );
}
