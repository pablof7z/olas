import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, Pressable, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { View, Text } from 'react-native';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { Video } from 'expo-av';
import { Button } from '../../nativewindui/Button';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { activeEventStore } from '@/app/stores';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo } from 'react';
import { isVideo } from '@/utils/media';
import Image from '@/components/media/image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { Reactions } from './Reactions';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
    image: {
        width: WINDOW_WIDTH,
        flex: 1,
        aspectRatio: 1,
    },
    video: {
        width: WINDOW_WIDTH,
        aspectRatio: 1.5,
        minHeight: 240,
        maxHeight: WINDOW_HEIGHT - 100,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        flexGrow: 1,
        minHeight: 240,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 2,
    },
});

export function VideoContainer({ url }: { url: string }) {
    return <Video style={styles.video} source={{ uri: url }} />;
}

export const CardMedia = memo(function CardMedia({ event, onPress }: { event: NDKEvent; onPress: () => void }) {
    const url = event.tagValue('url');

    if (url && isVideo(url)) return <VideoContainer url={url} />;

    return <Image event={event} style={styles.image} onPress={onPress} />;
});

export default function Post({ event }: { event: NDKEvent }) {
    const { ndk } = useNDK();
    const { isDarkColorScheme } = useColorScheme();
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);
    const { colors } = useColorScheme();
    const { currentUser } = useNDK();
    const { follows } = useNDKSession();
    const { loading } = User.useUserProfile();

    const follow = async () => {
        const followEvent = new NDKEvent(ndk);
        followEvent.kind = 967;
        followEvent.tags = [
            ['p', event.pubkey],
            ['k', NDKKind.Image.toString()],
            ['k', NDKKind.VerticalVideo.toString()],
        ];
        await followEvent.publish();

        await currentUser?.follow(event.author);
    };

    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/g, '');
    }

    return (
        <View className="overflow-hidden border-b bg-card py-2" style={{ borderColor: !isDarkColorScheme ? colors.grey5 : colors.grey2 }}>
            <View className="w-full flex-row items-center justify-between gap-2 p-2">
                <View style={styles.profileContainer}>
                    {loading ? (
                        <SkeletonPlaceholder borderRadius={4}>
                            <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
                                <SkeletonPlaceholder.Item width={60} height={60} borderRadius={50} />
                                <SkeletonPlaceholder.Item marginLeft={20}>
                                    <SkeletonPlaceholder.Item width={120} height={20} />
                                    <SkeletonPlaceholder.Item marginTop={6} width={80} height={20} />
                                </SkeletonPlaceholder.Item>
                            </SkeletonPlaceholder.Item>
                        </SkeletonPlaceholder>
                    ) : (
                        <User.Profile pubkey={event.pubkey}>
                            <TouchableOpacity
                                onPress={() => {
                                    router.push(`/profile?pubkey=${event.pubkey}`);
                                }}>
                                <User.Avatar alt={event.pubkey} />
                            </TouchableOpacity>

                            <View className="flex-col">
                                <User.Name className="font-bold text-foreground" />
                                <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            </View>
                        </User.Profile>
                    )}
                </View>

                {!follows?.includes(event.pubkey) && event.pubkey !== currentUser?.pubkey && (
                    <Button className="border border-primary bg-transparent" onPress={follow}>
                        <Text className="text-primary">Follow</Text>
                    </Button>
                )}
            </View>

            <View style={{ minHeight: Dimensions.get('window').width }}>
                <CardMedia
                    event={event}
                    onPress={() => {
                        setActiveEvent(event);
                        router.push('/view');
                    }}
                />
            </View>

            <Reactions event={event} />

            {event.content.trim().length > 0 && (
                <View className="p-2">
                    <EventContent
                        event={event}
                        content={content}
                        className="text-sm text-foreground"
                        onMentionPress={(pubkey) => {
                            router.push(`/profile?pubkey=${pubkey}`);
                        }}
                    />
                </View>
            )}
        </View>
    );
}
