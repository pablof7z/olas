import { activeEventStore } from "@/app/stores";
import { useNDK, useSubscribe } from "@/ndk-expo";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { router } from "expo-router";
import { Heart, MessageCircle, BookmarkIcon } from "lucide-react-native";
import { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { useStore } from "zustand";
import { useColorScheme } from "@/lib/useColorScheme";
import { Text } from "@/components/nativewindui/Text";
import { StyleSheet } from "react-native";
import AvatarGroup from "@/ndk-expo/components/user/AvatarGroup";

export function Reactions({ event }: { event: NDKEvent }) {
    const { currentUser } = useNDK();
    const filters = useMemo(
        () => [
            {
                kinds: [NDKKind.Text, 22, NDKKind.Reaction, NDKKind.BookmarkList],
                ...event.filter(),
            },
        ],
        [event.id]
    );
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
                    <TouchableOpacity onPress={react} className="!text-green-500">
                        <Heart size={24} fill={reactedByUser ? colors.foreground : 'transparent'} color={reactedByUser ? colors.foreground : colors.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reactionButton} onPress={comment}>
                        <MessageCircle size={24} color={commentedByUser ? colors.foreground : colors.muted} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.reactionButton} onPress={bookmark}>
                    <BookmarkIcon size={24} color={colors.muted} />
                </TouchableOpacity>
            </View>
            {reactions.length > 0 && (
                <View className="flex-row items-center gap-1 w-full flex-1 justify-between">
                    <Text className="text-sm font-medium" style={{ color: colors.muted }}>
                        {reactions.length} reactions
                    </Text>

                    <AvatarGroup events={relatedEvents} avatarSize={24} threshold={5} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});