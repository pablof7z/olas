import {
    NDKEvent,
    NDKKind,
    useUserProfile,
    useSubscribe,
    NDKSubscriptionOptions,
    NDKVideo,
    NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, Pressable, Share, StyleSheet } from 'react-native';
import { View } from 'react-native';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { activeEventStore } from '@/app/stores';
import { useStore } from 'zustand';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo, useMemo, useCallback } from 'react';
import { InlinedComments, Reactions } from './Reactions';
import FollowButton from '@/components/buttons/follow';
import { Text } from '@/components/nativewindui/Text';
import { MoreHorizontal, Repeat } from 'lucide-react-native';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSession, useFollows } from '@nostr-dev-kit/ndk-mobile';
import EventMediaContainer from '@/components/media/event';
import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';
import { useAtomValue, useSetAtom } from 'jotai';

const WINDOW_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
    image: {
        width: WINDOW_WIDTH,
        flex: 1,
        aspectRatio: 1,
    },
    video: {
        width: WINDOW_WIDTH,
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

const MediaSection = function MediaSection({ event, setActiveEvent }: { event: NDKEvent; setActiveEvent: (event: NDKEvent) => void }) {
    const maxHeight = Dimensions.get('window').height * 0.7;

    const onPress = useCallback(() => {
        setActiveEvent(event);
        router.push('/view');
    }, [event.id]);

    return <EventMediaContainer event={event} maxHeight={maxHeight} onPress={onPress} />;
};

export default function Post({ event, reposts, timestamp }: { event: NDKEvent; reposts: NDKEvent[]; timestamp: number }) {
    const { isDarkColorScheme } = useColorScheme();
    const setActiveEvent = useStore(activeEventStore, (state) => state.setActiveEvent);
    const { colors } = useColorScheme();

    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/g, '');
    }

    return (
        <View className="overflow-hidden border-b bg-card py-2" style={{ borderColor: !isDarkColorScheme ? colors.grey5 : colors.grey2 }}>
            <PostHeader event={event} reposts={reposts} timestamp={timestamp} />

            <MediaSection event={event} setActiveEvent={setActiveEvent} />

            <PostBottom event={event} trimmedContent={content} />
        </View>
    );
}

export function PostHeader({ event, reposts, timestamp }: { event: NDKEvent; reposts: NDKEvent[]; timestamp: number }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const { colors } = useColorScheme();
    let clientName = event.tagValue('client');

    if (clientName?.startsWith('31990')) clientName = undefined;

    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openOptionsMenu = useCallback(() => {
        setOptionsMenuEvent(event);
        optionsSheetRef.current?.present();
    }, [event, optionsSheetRef]);

    return (
        <View className="flex-col p-2">
            {reposts.length > 0 && (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <View className="w-full flex-row items-center justify-between gap-2 pb-0">
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            <Repeat size={16} color={'green'} />

                            <AvatarGroup pubkeys={reposts.map((r) => r.pubkey)} avatarSize={14} threshold={5} />

                            <Text className="text-xs text-muted-foreground">
                                {'Reposted '}
                                <RelativeTime timestamp={timestamp} />
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View className="w-full flex-row items-center justify-between gap-2">
                <View style={styles.profileContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            router.push(`/profile?pubkey=${event.pubkey}`);
                        }}>
                        <User.Avatar userProfile={userProfile} />
                    </TouchableOpacity>

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} className="font-bold text-foreground" />
                        <Text>
                            <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            {clientName && (
                                <Text className="truncate text-xs text-muted-foreground" numberOfLines={1}>
                                    {` via ${clientName}`}
                                </Text>
                            )}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <FollowButton pubkey={event.pubkey} />

                    <Pressable onPress={openOptionsMenu}>
                        <MoreHorizontal size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const PostBottom = memo(
    function PostBottom({ event, trimmedContent }: { event: NDKEvent; trimmedContent: string }) {
        const currentUser = useNDKCurrentUser();
        const follows = useFollows();
        const filters = useMemo(
            () => [
                {
                    kinds: [
                        NDKKind.Text,
                        NDKKind.GenericReply,
                        NDKKind.Reaction,
                        NDKKind.GenericRepost,
                        NDKKind.Repost,
                        NDKKind.BookmarkList,
                        NDKKind.Zap,
                        NDKKind.Nutzap,
                    ],
                    ...event.filter(),
                },
            ],
            [event.id]
        );
        const opts = useMemo<NDKSubscriptionOptions>(
            () => ({
                groupable: false,
                skipVerification: true,
                cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
                closeOnEose: true,
            }),
            []
        );
        const { events: relatedEvents } = useSubscribe({ filters, opts });

        const isComment = (e: NDKEvent) => [NDKKind.Text, 1111].includes(e.kind);

        const commentsByFollows = useMemo(() => {
            if (!follows) return [];
            return relatedEvents.filter(isComment).filter((c) => c.pubkey === currentUser?.pubkey || follows.includes(c.pubkey));
        }, [relatedEvents, follows, currentUser?.pubkey]);

        return (
            <View className="flex-1 flex-col gap-1 p-2">
                <Reactions event={event} relatedEvents={relatedEvents} />

                {trimmedContent.length > 0 && (
                    <EventContent
                        event={event}
                        content={trimmedContent}
                        className="text-sm text-foreground"
                        onMentionPress={(pubkey) => {
                            router.push(`/profile?pubkey=${pubkey}`);
                        }}
                    />
                )}

                <InlinedComments comments={commentsByFollows} allCommentsCount={relatedEvents.filter(isComment).length} />
            </View>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.event.id === nextProps.event.id;
    }
);
