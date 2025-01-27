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
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import Zaps from './Reactions/Zaps';
import Bookmark from './Bookmark';
import { useObserver } from '@/hooks/observer';
import EventContent from '@/components/ui/event/content';

export function Reactions({
    event,
    foregroundColor,
    mutedColor,
}: {
    event: NDKEvent;
    foregroundColor?: string;
    mutedColor?: string;
}) {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const allEvents = useObserver([ event.filter() ], [event.id])

    const { reactionCount, reactedByUser, commentCount, commentedByUser, zapEvents, bookmarkedByUser } = useMemo(() => {
        let reactions = new Set();
        let reactedByUser = false;
        let commentCount = 0;
        let commentedByUser = false;
        let zapEvents = [];
        let bookmarkedByUser = false;
        for (const e of allEvents) {
            switch (e.kind) {
                case NDKKind.Reaction:
                    reactions.add(e.pubkey);
                    if (e.pubkey === currentUser?.pubkey) reactedByUser = true;
                    break;
                case NDKKind.Text:
                case NDKKind.GenericReply:
                    commentCount++;
                    if (e.pubkey === currentUser?.pubkey) commentedByUser = true;
                    break;
                case NDKKind.Nutzap:
                case NDKKind.Zap:
                    zapEvents.push(e);
                    break;
                case 3006:
                    bookmarkedByUser = e.pubkey === currentUser?.pubkey;
                    break;
            }
        }
        return {
            reactionCount: reactions.size,
            reactedByUser,
            commentCount,
            commentedByUser,
            zapEvents,
            bookmarkedByUser
        };
    }, [allEvents.length, currentUser?.pubkey])

    mutedColor ??= colors.muted;
    foregroundColor ??= colors.foreground;

    return (
        <View style={styles.container}>
            <View style={styles.group}>
                <React
                    event={event}
                    mutedColor={mutedColor}
                    reactedByUser={reactedByUser}
                    reactionCount={reactionCount}
                />

                <Comment
                    event={event}
                    mutedColor={mutedColor}
                    foregroundColor={foregroundColor}
                    commentedByUser={commentedByUser}
                    commentCount={commentCount}
                />

                <Zaps
                    currentUser={currentUser}
                    event={event}
                    zaps={zapEvents}
                    mutedColor={mutedColor} />
            </View>

            <Bookmark
                event={event}
                mutedColor={mutedColor}
                bookmarkedByUser={bookmarkedByUser}
            />
        </View>
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
