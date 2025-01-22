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

const repostKinds = [NDKKind.GenericRepost, NDKKind.Repost] as const;
const zapKinds = [NDKKind.Zap, NDKKind.Nutzap] as const;

export function Reactions({
    event,
    foregroundColor,
    mutedColor,
}: {
    event: NDKEvent;
    foregroundColor?: string;
    mutedColor?: string;
}) {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.ImageCurationSet, { create: true });
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    
    mutedColor ??= colors.muted;
    foregroundColor ??= colors.foreground;
    
    return (
        <View className="flex-1 flex-col gap-1">
            <View className="w-full flex-1 flex-row justify-between gap-4">
                <View style={{ flex: 1, gap: 10, flexDirection: 'row' }}>
                    <React
                        event={event}
                        mutedColor={mutedColor}
                        currentUser={currentUser}
                    />

                    <Comment
                        event={event}
                        mutedColor={mutedColor}
                        foregroundColor={foregroundColor}
                        currentUser={currentUser}
                    />

                    <Zaps currentUser={currentUser} event={event} style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }} foregroundColor={foregroundColor} mutedColor={mutedColor} />
                </View>

                <Bookmark
                    event={event}
                    mutedColor={mutedColor}
                    foregroundColor={foregroundColor}
                    currentUser={currentUser}
                />
            </View>
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
