import { activeEventStore } from '@/app/stores';
import { NDKEvent, NDKKind, NDKList, useNDKSession, useNDKSessionEventKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { Heart, MessageCircle, BookmarkIcon } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useStore } from 'zustand';
import { useColorScheme } from '@/lib/useColorScheme';
import { Text } from '@/components/nativewindui/Text';
import { StyleSheet } from 'react-native';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';

export function Reactions({ event, relatedEvents }: { event: NDKEvent, relatedEvents: NDKEvent[] }) {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.ImageCurationSet, { create: true });
    const { currentUser } = useNDK();
    const { colors } = useColorScheme();
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);

    useEffect(() => {
        console.log('imageCurationSet', imageCurationSet?.items);
    }, [imageCurationSet]);

    const react = async () => {
        const r = await event.react('+1', false);
        r.tags.push(['K', event.kind.toString()]);
        await r.sign();
        await r.publish();
    };

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comments`);
    };

    const bookmark = async () => {
        if (imageCurationSet.has(event.id)) {
            await imageCurationSet.removeItemByValue(event.id);
        } else {
            await imageCurationSet.addItem(event);
        }
        await imageCurationSet.publishReplaceable();
    };

    const reactions = useMemo(() => relatedEvents.filter((r) => r.kind === NDKKind.Reaction), [relatedEvents]);
    const reactedByUser = useMemo(() => reactions.find((r) => r.pubkey === currentUser?.pubkey), [reactions, currentUser?.pubkey]);

    const comments = useMemo(() => relatedEvents.filter((r) => [NDKKind.Text, 22].includes(r.kind)), [relatedEvents]);
    const commentedByUser = useMemo(() => comments.find((c) => c.pubkey === currentUser?.pubkey), [comments, currentUser?.pubkey]);

    const isBookmarkedByUser = useMemo(() => imageCurationSet.has(event.id), [imageCurationSet, event.id]);

    return (
        <View className="flex-1 flex-col gap-1 p-2">
            <View className="w-full flex-1 flex-row justify-between gap-4">
                <View style={{ flex: 1, gap: 10, flexDirection: 'row' }}>
                    <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={react}>
                            <Heart
                                size={24}
                                fill={reactedByUser ? colors.foreground : 'transparent'}
                                color={reactedByUser ? colors.foreground : colors.muted}
                            />
                        </TouchableOpacity>
                        {reactions.length > 0 && (
                            <Text className="text-sm font-medium" style={{ color: colors.muted }}>{reactions.length}</Text>
                        )}
                    </View>

                    <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.reactionButton} onPress={comment}>
                            <MessageCircle size={24} color={commentedByUser ? colors.foreground : colors.muted} />
                        </TouchableOpacity>
                        {comments.length > 0 && (
                            <Text className="text-sm font-medium" style={{ color: colors.muted }}>{comments.length}</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity style={styles.reactionButton} onPress={bookmark}>
                    <BookmarkIcon size={24} fill={isBookmarkedByUser ? 'red' : 'transparent'} color={isBookmarkedByUser ? 'red' : colors.muted} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export function InlinedComments({ comments, allCommentsCount }: { comments: NDKEvent[], allCommentsCount: number }) {
    return (
        <View className="flex-1 flex-col gap-0">
            {comments.slice(0, 3).map((c) => <InlineComment comment={c} />)}
            {allCommentsCount > 3 && <Text className="text-sm text-muted-foreground">+{allCommentsCount - 3} more</Text>}
        </View>
    );
}

export function InlineComment({ comment }: { comment: NDKEvent }) {
    const { userProfile } = useUserProfile(comment.pubkey);
    return (
        <Text>
            <Text className="text-sm font-medium">@{userProfile?.name}{' '}</Text>
            <Text className="text-sm">{comment.content}</Text>
        </Text>
    )
}

const styles = StyleSheet.create({
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});
