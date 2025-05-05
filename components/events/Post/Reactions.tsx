import {
    type NDKEvent,
    NDKKind,
    NDKList,
    NostrEvent,
    useProfileValue,
} from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import Comment from '../Comment';
import React from '../React';
import Repost from '../Repost';
import Zaps from './Reactions/Zaps';

import { Text } from '@/components/nativewindui/Text';
import EventContent from '@/components/ui/event/content';
import { useColorScheme } from '@/lib/useColorScheme';
import { DEFAULT_STATS, type ReactionStats } from '@/stores/reactions';
import { WALLET_ENABLED } from '@/utils/const';

export function Reactions({
    event,
    foregroundColor,
    inactiveColor,
    reactions,
    iconSize = 28,
}: {
    event: NDKEvent;
    foregroundColor?: string;
    inactiveColor?: string;
    reactions?: ReactionStats;
    iconSize?: number;
}) {
    const { colors } = useColorScheme();
    const {
        reactionCount,
        reactedByUser,
        commentCount,
        commentedByUser,
        repostedBy,
        repostedByUser,
    } = useMemo(() => reactions ?? DEFAULT_STATS, [reactions?.commentCount, event.id]);

    inactiveColor ??= colors.foreground;
    foregroundColor ??= colors.foreground;

    return (
        // <View style={styles.container}>
        <View style={styles.group}>
            <React
                event={event}
                inactiveColor={inactiveColor}
                reactedByUser={reactedByUser ?? undefined}
                reactionCount={reactionCount}
                iconSize={iconSize}
            />

            <Comment
                event={event}
                inactiveColor={inactiveColor}
                foregroundColor={foregroundColor}
                commentedByUser={commentedByUser}
                commentCount={commentCount}
                iconSize={iconSize}
            />

            <Repost
                event={event}
                inactiveColor={inactiveColor}
                activeColor={foregroundColor}
                repostedBy={repostedBy}
                repostedByUser={repostedByUser}
                iconSize={iconSize}
            />

            {WALLET_ENABLED && (
                <Zaps event={event} inactiveColor={inactiveColor} iconSize={iconSize} />
            )}
        </View>

        //     <Bookmark
        //         event={event}
        //         inactiveColor={inactiveColor}
        //         bookmarkedByUser={bookmarkedByUser}
        //     />
        // </View>
    );
}

export function InlinedComments({
    event,
    reactions,
}: { event: NDKEvent; reactions?: ReactionStats }) {
    const comments = reactions?.comments ?? [];

    if (comments.length === 0) {
        return null;
    }

    return (
        <View className="flex-1 flex-col gap-0 p-2">
            {comments.slice(0, 3).map((c) => (
                <InlineComment key={c.id} comment={c} />
            ))}
            {comments.length > 3 && (
                <Text className="text-sm text-muted-foreground">+{comments.length - 3} more</Text>
            )}
        </View>
    );
}

export function InlineComment({ comment }: { comment: NDKEvent }) {
    const userProfile = useProfileValue(comment.pubkey, { subOpts: { skipVerification: true } });
    return (
        <Text>
            <Text className="text-sm font-medium text-foreground">@{userProfile?.name} </Text>
            <EventContent
                event={comment}
                numberOfLines={2}
                className="text-sm text-muted-foreground"
            >
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
    },
});
