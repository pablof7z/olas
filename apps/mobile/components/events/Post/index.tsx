import { NDKEvent, NDKKind, useUserProfile, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, StyleSheet } from 'react-native';
import { View } from 'react-native';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { Video } from 'expo-av';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { activeEventStore } from '@/app/stores';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo, useMemo, useRef, useMemo } from 'react';
import { isVideo } from '@/utils/media';
import Image from '@/components/media/image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { InlinedComments, Reactions } from './Reactions';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import FollowButton from '@/components/buttons/follow';
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

const MediaSection = memo(function MediaSection({ 
    event, 
    setActiveEvent 
}: { 
    event: NDKEvent;
    setActiveEvent: (event: NDKEvent) => void;
}) {
    return (
        <View style={{ minHeight: Dimensions.get('window').width*0.4 }}>
            <CardMedia
                event={event}
                onPress={() => {
                    setActiveEvent(event);
                    router.push('/view');
                }}
            />
        </View>
    );
}, (prevProps, nextProps) => prevProps.event.id === nextProps.event.id);

const MemoizedReactions = memo(function MemoizedReactions({ event }: { event: NDKEvent }) {
    return <Reactions event={event} />;
}, (prevProps, nextProps) => prevProps.event.id === nextProps.event.id);

export default function Post({ event }: { event: NDKEvent }) {
    const renderCounter = useRef<Record<string, number>>({});

    renderCounter.current[event.id] = (renderCounter.current[event.id] || 0) + 1;
    console.log(`Post ${event.id.substring(0, 8)} render #${renderCounter.current[event.id]}`);

    const { isDarkColorScheme } = useColorScheme();
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);
    const { colors } = useColorScheme();
    const { userProfile, loading } = useUserProfile(event.pubkey);

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
                        <>
                            <TouchableOpacity
                                onPress={() => {
                                    router.push(`/profile?pubkey=${event.pubkey}`);
                                }}>
                                <User.Avatar userProfile={userProfile} />
                            </TouchableOpacity>

                            <View className="flex-col">
                                <User.Name userProfile={userProfile} pubkey={event.pubkey} className="font-bold text-foreground" />
                                <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            </View>
                        </>
                    )}
                </View>

                <FollowButton pubkey={event.pubkey} />
            </View>

            <MediaSection event={event} setActiveEvent={setActiveEvent} />

            <MemoizedReactions event={event} />

            {event.content.trim().length > 0 && (
                <View className="p-2">
                    <EventContent
                        event={event}
                        content={trimmedContent}
                        className="text-sm text-foreground"
                        onMentionPress={(pubkey) => {
                            router.push(`/profile?pubkey=${pubkey}`);
                        }}
                    />
                </View>
            )}

            <InlinedComments comments={commentsByFollows} allCommentsCount={relatedEvents.filter(isComment).length} />
        </View>
    )
}
