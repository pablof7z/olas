import { NDKEvent, NDKKind, NDKList, NostrEvent, useNDKSessionEventKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { Heart, MessageCircle, BookmarkIcon, Repeat, Zap } from 'lucide-react-native';
import React from '../React';
import { useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Text } from '@/components/nativewindui/Text';
import { StyleSheet } from 'react-native';
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import Zaps from './Reactions/Zaps';
import { useSetAtom } from 'jotai';
import { activeEventAtom } from '@/stores/event';

const repostKinds = [NDKKind.GenericRepost, NDKKind.Repost] as const;
const zapKinds = [NDKKind.Zap, NDKKind.Nutzap] as const;

export function Reactions({
    event,
    relatedEvents,
    foregroundColor,
    mutedColor,
}: {
    event: NDKEvent;
    relatedEvents: NDKEvent[];
    foregroundColor?: string;
    mutedColor?: string;
}) {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.ImageCurationSet, { create: true });
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const setActiveEvent = useSetAtom(activeEventAtom);
    mutedColor ??= colors.muted;
    foregroundColor ??= colors.foreground;

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comments`);
    };

    const repost = async () => {
        const repostEvent = await event.repost(false);
        await repostEvent.sign();
        repostEvent.publish();
    };

    const bookmark = async () => {
        if (imageCurationSet.has(event.id)) {
            await imageCurationSet.removeItemByValue(event.id);
        } else {
            await imageCurationSet.addItem(event);
        }
        imageCurationSet.publishReplaceable();

        const bookmarkEvent = new NDKEvent(event.ndk, {
            kind: 3006,
            tags: [['k', event.kind.toString()]],
        } as NostrEvent);
        bookmarkEvent.tag(event);
        bookmarkEvent.publish();
    };

    const { reactions, comments, commentedByUser, reposts, repostedByUser, zaps, isBookmarkedByUser } = useMemo(
        () => ({
            reactions: relatedEvents.filter((r) => r.kind === NDKKind.Reaction),
            comments: relatedEvents.filter((r) => [NDKKind.Text, 1111].includes(r.kind)),
            commentedByUser: relatedEvents.find((r) => [NDKKind.Text, 1111].includes(r.kind) && r.pubkey === currentUser?.pubkey),
            reposts: relatedEvents.filter((r) => repostKinds.includes(r.kind)),
            repostedByUser: relatedEvents.find((r) => repostKinds.includes(r.kind) && r.pubkey === currentUser?.pubkey),
            zaps: relatedEvents.filter((r) => zapKinds.includes(r.kind)),
            isBookmarkedByUser: imageCurationSet.has(event.id),
        }),
        [relatedEvents, currentUser?.pubkey, imageCurationSet?.id, event.id]
    );

    return (
        <View className="flex-1 flex-col gap-1">
            <View className="w-full flex-1 flex-row justify-between gap-4">
                <View style={{ flex: 1, gap: 10, flexDirection: 'row' }}>
                    <React
                        event={event}
                        mutedColor={mutedColor}
                        allReactions={reactions}
                        currentUser={currentUser}
                    />

                    <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.reactionButton} onPress={comment}>
                            <MessageCircle size={24} color={commentedByUser ? foregroundColor : mutedColor} />
                        </TouchableOpacity>
                        {comments.length > 0 && (
                            <Text className="text-sm font-medium" style={{ color: mutedColor }}>
                                {comments.length}
                            </Text>
                        )}
                    </View>

                    <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.reactionButton} onPress={repost}>
                            <Repeat size={24} color={repostedByUser ? foregroundColor : mutedColor} />
                        </TouchableOpacity>
                        {reposts.length > 0 && (
                            <Text className="text-sm font-medium" style={{ color: mutedColor }}>
                                {reposts.length}
                            </Text>
                        )}
                    </View>

                    <Zaps event={event} style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }} zaps={zaps} foregroundColor={foregroundColor} mutedColor={mutedColor} />
                </View>

                <TouchableOpacity style={styles.reactionButton} onPress={bookmark}>
                    <BookmarkIcon
                        size={24}
                        fill={isBookmarkedByUser ? 'red' : 'transparent'}
                        color={isBookmarkedByUser ? 'red' : mutedColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export function InlinedComments({ comments, allCommentsCount }: { comments: NDKEvent[]; allCommentsCount: number }) {
    if (comments.length === 0) return null;

    return (
        <View className="flex-1 flex-col gap-0 p-2">
            {comments.slice(0, 3).map((c) => (
                <InlineComment key={c.id} comment={c} />
            ))}
            {allCommentsCount > 3 && <Text className="text-sm text-muted-foreground">+{allCommentsCount - 3} more</Text>}
        </View>
    );
}

export function InlineComment({ comment }: { comment: NDKEvent }) {
    const { userProfile } = useUserProfile(comment.pubkey);
    return (
        <Text>
            <Text className="text-sm font-medium">@{userProfile?.name} </Text>
            <Text numberOfLines={2} className="text-sm">
                {comment.content}
            </Text>
        </Text>
    );
}

const styles = StyleSheet.create({
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});
