import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import * as User from '@/ndk-expo/components/user';
import EventContent from '@/ndk-expo/components/event/content';
import RelativeTime from '@/app/components/relative-time';
import { ResizeMode, Video } from 'expo-av';
import { Button } from '../nativewindui/Button';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { activeEventStore } from '@/app/stores';
import { imetaFromEvent } from '@/ndk-expo/utils/imeta';
import { useColorScheme } from '@/lib/useColorScheme';
import { useMemo, memo } from 'react';
import { useNDK, useSubscribe } from '@/ndk-expo';
import { BookmarkIcon, Heart, MessageCircle } from 'lucide-react-native';
import { useNDKSession } from '@/ndk-expo/hooks/session';
import { isVideo } from '@/utils/media';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
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
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});

export function VideoContainer({ url }: { url: string }) {
    return <Video style={styles.video} source={{ uri: url }} />;
}

export function Reactions({ event }: { event: NDKEvent }) {
    const { currentUser } = useNDK();
    const filters = useMemo(() => [{ kinds: [NDKKind.Text, 22, NDKKind.Reaction, NDKKind.BookmarkList], ...event.filter() }], [event.id]);
    const opts = useMemo(() => ({ groupable: true }), []);
    const { events: relatedEvents } = useSubscribe({ filters, opts });
    const { colors } = useColorScheme();
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);

    const react = async () => {
        const r = await event.react('+1', false);
        r.tags.push(['k', event.kind.toString()]);
        await r.sign();
        console.log('reaction', JSON.stringify(r, null, 2));
        await r.publish();
    };

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comments`);
    };

    const bookmark = async () => {
        alert('Not implemented yet');
    };

    const reactions = useMemo(() => relatedEvents.filter((r) => r.kind === NDKKind.Reaction), [relatedEvents]);
    const reactedByUser = useMemo(() => reactions.find((r) => r.pubkey === currentUser?.pubkey), [reactions, currentUser?.pubkey]);

    const comments = useMemo(() => relatedEvents.filter((r) => [NDKKind.Text, 22].includes(r.kind)), [relatedEvents]);
    const commentedByUser = useMemo(() => comments.find((c) => c.pubkey === currentUser?.pubkey), [comments, currentUser?.pubkey]);

    return (
        <View className="flex-1 flex-col gap-1 p-2">
            <View className="w-full flex-1 flex-row justify-between gap-4">
                <View style={{ flex: 1, gap: 10, flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.reactionButton} onPress={react}>
                        <Heart size={24} color={!reactedByUser ? colors.primary : 'red'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reactionButton} onPress={comment}>
                        <MessageCircle size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.reactionButton} onPress={bookmark}>
                    <BookmarkIcon size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {reactions.length > 0 && (
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    {reactions.length} reactions
                </Text>
            )}
        </View>
    );
}

const Kind1Media = memo(function Kind1Media({ event }: { event: NDKEvent }) {
    const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);

    if (!urls?.length) return null;

    const imageUrl = getProxiedImageUrl(urls[0]);

    return <Image source={{ uri: imageUrl }} style={styles.image} placeholder={{ blurhash: 'U1LQF[-;~qs,}' }} contentFit="fill" />;
});

export const CardMedia = memo(function CardMedia({ event }: { event: NDKEvent }) {
    const url = event.tagValue('url');

    if (url && isVideo(url)) return <VideoContainer url={url} />;
    if (event.kind === NDKKind.Text) return <Kind1Media event={event} />;
    if (!url) return null;

    const imeta = useMemo(() => imetaFromEvent(event), [event]);

    const imageUrl = useMemo(() => getProxiedImageUrl(url), [url]);

    return (
        <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            placeholder={{ blurhash: imeta?.blurhash }}
            allowDownscaling={true}
            contentPosition="center"
            contentFit="cover"
        />
    );
});

export default function ImageCard({ event }: { event: NDKEvent }) {
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);
    const { colors } = useColorScheme();
    const { currentUser } = useNDK();
    const { follows } = useNDKSession();
    const { loading } = User.useUserProfile();

    const follow = async () => {
        await currentUser?.follow(event.author);
    };

    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/g, '');
    }

    return (
        <View className="overflow-hidden border-b border-gray-200 bg-card py-2">
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
                                <User.Name />
                                <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            </View>
                        </User.Profile>
                    )}
                </View>

                {!follows?.includes(event.pubkey) && event.pubkey !== currentUser?.pubkey && (
                    <Button style={{ backgroundColor: colors.grey5 }} onPress={follow}>
                        <Text className="text-primary-secondary">Follow</Text>
                    </Button>
                )}
            </View>

            <Pressable
                onPress={() => {
                    setActiveEvent(event);
                    router.push('/view');
                }}
                style={styles.container}>
                <CardMedia event={event} />
            </Pressable>

            <Reactions event={event} />

            {event.content.trim().length > 0 && (
                <View className="p-2">
                    <EventContent
                        event={event}
                        content={content}
                        className="text-sm"
                        onMentionPress={(pubkey) => {
                            router.push(`/profile?pubkey=${pubkey}`);
                        }}
                    />
                </View>
            )}
        </View>
    );
}
