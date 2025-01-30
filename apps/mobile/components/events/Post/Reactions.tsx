import { NDKEvent, NDKKind, NDKList, NostrEvent, useNDKSessionEventKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { Heart, MessageCircle, BookmarkIcon, Repeat, Zap } from 'lucide-react-native';
import React from '../React';
import Comment from '../Comment';
import { useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Text } from '@/components/nativewindui/Text';
import { StyleSheet } from 'react-native';
import Zaps from './Reactions/Zaps';
import Bookmark from './Bookmark';
import EventContent from '@/components/ui/event/content';
import { DEFAULT_STATS, useReactionsStore } from '@/stores/reactions';
import { useObserver } from '@/hooks/observer';
import Repost from '../Repost';

export function Reactions({
    event,
    foregroundColor,
    inactiveColor,
}: {
    event: NDKEvent;
    foregroundColor?: string;
    inactiveColor?: string;
}) {
    const { colors } = useColorScheme();
    const reactions = useReactionsStore(state => state.reactions);
    const {
        reactionCount,
        reactedByUser,
        commentCount,
        commentedByUser,
        repostCount,
        repostedByUser,
        zappedAmount,
        zappedByUser,
        bookmarkedByUser
    } = useMemo(() => reactions.get(event.id) ?? DEFAULT_STATS, [reactions, event.id]);
    
    inactiveColor ??= colors.foreground;
    foregroundColor ??= colors.foreground;

    return (
        // <View style={styles.container}>
            <View style={styles.group}>
                <React
                    event={event}
                    inactiveColor={inactiveColor}
                    reactedByUser={reactedByUser}
                    reactionCount={reactionCount}
                    iconSize={28}
                />

                <Comment
                    event={event}
                    inactiveColor={inactiveColor}
                    foregroundColor={foregroundColor}
                    commentedByUser={commentedByUser}
                    commentCount={commentCount}
                    iconSize={28}
                />
            
                <Repost
                    event={event}
                    inactiveColor={inactiveColor}
                    activeColor={foregroundColor}
                    repostedByUser={repostedByUser}
                    repostCount={repostCount}
                    iconSize={28}
                />

                <Zaps
                    event={event}
                    inactiveColor={inactiveColor}
                    zappedAmount={zappedAmount}
                    zappedByUser={zappedByUser}
                    iconSize={28}
                />
            </View>

        //     <Bookmark
        //         event={event}
        //         inactiveColor={inactiveColor}
        //         bookmarkedByUser={bookmarkedByUser}
        //     />
        // </View>
    );
}

export function InlinedComments({ event }: { event: NDKEvent }) {
    const comments = useObserver([
        { kinds: [NDKKind.GenericReply ], ...event.filter() },
    ], [event.id])

    if (comments.length === 0) return null;

    return (
        <View className="flex-1 flex-col gap-0 p-2">
            {comments.slice(0, 3).map((c) => (
                <InlineComment key={c.id} comment={c} />
            ))}
            {comments.length > 3 && <Text className="text-sm text-muted-foreground">+{comments.length - 3} more</Text>}
        </View>
    );
}

export function InlineComment({ comment }: { comment: NDKEvent }) {
    const { userProfile } = useUserProfile(comment.pubkey);
    return (
        <Text>
            <Text className="text-sm font-medium text-foreground">@{userProfile?.name} </Text>
            <EventContent event={comment} numberOfLines={2} className="text-sm text-muted-foreground">
                {comment.content}
            </EventContent>
        </Text>
    );
}

const styles = StyleSheet.create({
    container: {    
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    group: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
    }
});
