import { NDKEvent, NDKKind, useUserProfile, useSubscribe, useNDK, NDKSubscriptionOptions } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, StyleSheet } from 'react-native';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { Video } from 'expo-av';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { activeEventStore } from '@/app/stores';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo, useRef, useMemo, useCallback } from 'react';
import Image from '@/components/media/image';
import { InlinedComments, Reactions } from './Reactions';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import FollowButton from '@/components/buttons/follow';
import { Text } from '@/components/nativewindui/Text';
import { DropdownMenu } from '@/components/nativewindui/DropdownMenu';
import { MoreVertical, Repeat } from 'lucide-react-native';
import { createDropdownItem } from '@/components/nativewindui/DropdownMenu/utils';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
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

const MediaSection = function MediaSection({ 
    event, 
    setActiveEvent 
}: { 
    event: NDKEvent;
    setActiveEvent: (event: NDKEvent) => void;
}) {
    const maxHeight = Dimensions.get('window').height * 0.7;

    const onPress = useCallback(() => {
        setActiveEvent(event);
        router.push('/view');
    }, [ event.id ])
    
    return (
        <View style={{ flex: 1 }}>
            <Image key={event.id} maxHeight={maxHeight} event={event} onPress={onPress} />
        </View>
    );
}

// const MemoizedReactions = memo(function MemoizedReactions({ event }: { event: NDKEvent }) {
//     return <Reactions event={event} />;
// }, (prevProps, nextProps) => prevProps.event.id === nextProps.event.id);

export default function Post({ event, reposts }: { event: NDKEvent, reposts: NDKEvent[] }) {
    const { isDarkColorScheme } = useColorScheme();
    const setActiveEvent = useStore(activeEventStore, (state) => state.setActiveEvent);
    const { colors } = useColorScheme();

    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/g, '');
    }

    return (
        <View className="overflow-hidden border-b bg-card" style={{ borderColor: !isDarkColorScheme ? colors.grey5 : colors.grey2 }}>
            <PostHeader event={event} reposts={reposts} />

            <MediaSection event={event} setActiveEvent={setActiveEvent} />

            <PostBottom event={event} trimmedContent={content} />
        </View>
    )
}

export function PostHeader({ event, reposts }: { event: NDKEvent, reposts: NDKEvent[] }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const clientName = event.tagValue('client');
    
    return (
        <View className="flex-col">
            <View className="w-full flex-row items-center justify-between gap-2 p-2">
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
                                <Text className="text-xs text-muted-foreground">
                                    {` via ${clientName}`}
                                </Text>
                            )}
                        </Text>

                        {reposts.length > 0 && (
                            <View className="flex-row gap-1 items-center">
                                <Repeat size={14} color={'green'} />
                                <AvatarGroup pubkeys={reposts.map((r) => r.pubkey)} avatarSize={14} threshold={5} />
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <FollowButton pubkey={event.pubkey} />
                    <PostOptions event={event} />
                </View>
            </View>
        </View>
    )
}

function PostOptions({ event }: { event: NDKEvent }) {
    const { currentUser } = useNDK();
    const options = [
        createDropdownItem({
            actionKey: 'copy',
            title: 'Copy ID',
        }),
    ];

    if (currentUser?.pubkey === event.pubkey) {
        options.push(createDropdownItem({
            actionKey: 'delete',
            title: 'Delete',
        }));
    }

    const deletePost = async (event: NDKEvent) => {
        event.delete();
    }

    const copyId = async (event: NDKEvent) => Clipboard.setStringAsync(event.encode());

    const copyLink = async (event: NDKEvent) => {
        Clipboard.setUrlAsync('https://njump.me/' + event.encode());
    }
    
    return (
        <DropdownMenu
            items={options}
            onItemPress={(item) => {
                if (item.actionKey === 'delete') {
                    deletePost(event);
                } else if (item.actionKey === 'copy') {
                    copyId(event);
                }
            }}
        >
            <MoreVertical size={20} />
        </DropdownMenu>
    )
}

const PostBottom = memo(function PostBottom({ event, trimmedContent }: { event: NDKEvent, trimmedContent: string }) {
    const { currentUser } = useNDK();
    const { follows } = useNDKSession();
    const filters = useMemo(
        () => [
            {
                kinds: [NDKKind.Text, 1111, NDKKind.Reaction, NDKKind.GenericRepost, NDKKind.Repost, NDKKind.BookmarkList, NDKKind.Zap, NDKKind.Nutzap],
                ...event.filter(),
            },
        ],
        [event.id]
    );
    const opts = useMemo<NDKSubscriptionOptions>(() => ({
        groupable: true,
        groupableDelay: 1000,
        groupableDelayType: 'at-least'
    }), []);
    const { events: relatedEvents } = useSubscribe({ filters, opts });

    const isComment = (e: NDKEvent) => [NDKKind.Text, 1111].includes(e.kind);

    const commentsByFollows = useMemo(() => {
        if (!follows) return [];
        return relatedEvents
            .filter(isComment)
            .filter((c) => c.pubkey === currentUser?.pubkey || follows.includes(c.pubkey));
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
}, (prevProps, nextProps) => {
    return prevProps.event.id === nextProps.event.id;
});
