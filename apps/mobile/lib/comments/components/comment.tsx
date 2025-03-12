import { Pressable, View, ViewStyle, StyleSheet } from "react-native";
import * as Clipboard from 'expo-clipboard';

import { NDKKind } from "@nostr-dev-kit/ndk-mobile";

import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";

import { useColorScheme } from "@/lib/useColorScheme";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";

import { useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { StyleProp } from "react-native";
import { useObserver } from "@/hooks/observer";
import { useCallback } from "react";
import { replyEventAtom } from "../store";
import { toast } from "@backpackapp-io/react-native-toast";
import { router } from "expo-router";
import { cn } from "@/lib/cn";
import * as User from "@/components/ui/user";
import EventContent from "@/components/ui/event/content";
import { Text } from "@/components/nativewindui/Text";
import React from "@/components/events/React";
import RelativeTime from "@/components/relative-time";
import { useUserFlare } from "@/hooks/user-flare";
import { colorWithOpacity } from "@/theme/colors";

export function Comment({ item, style }: { item: NDKEvent, style?: StyleProp<ViewStyle> }) {
    const { userProfile } = useUserProfile(item.pubkey);
    const [replyEvent, setReplyEvent] = useAtom(replyEventAtom);
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const flare = useUserFlare(item.pubkey);
    const reactions = useObserver(
        [{ kinds: [NDKKind.Reaction], '#e': [item.id] }],
        {}, [item.id]
    );

    const onReplyPress = useCallback(() => {
        setReplyEvent(item);
    }, [item.id]);

    const isReplying = useMemo(() => {
        return item.id === replyEvent?.id;
    }, [item.id, replyEvent?.id]);

    const copyEventId = useCallback(() => {
        Clipboard.setStringAsync(item.encode());
        toast.success('Event ID copied to clipboard');
    }, [item.id]);

    const containerStyle = useMemo<ViewStyle>(() => {
        const s = [styles.container, style];
        if (isReplying) s.push({ backgroundColor: colorWithOpacity(colors.primary, 0.1) });
        return s;
    }, [style, isReplying]);

    return (
        <View style={containerStyle} className={cn(
            "transition-all duration-300",
            isReplying && "!bg-accent/10"
        )}>
            <Pressable onPress={() => router.push(`/profile?pubkey=${item.pubkey}`)} style={styles.avatar}>
                <User.Avatar pubkey={item.pubkey} userProfile={userProfile} imageSize={32} flare={flare} borderWidth={1} />
            </Pressable>

            <View className="flex-col flex-1">
                <View className="flex-row items-center gap-1">
                    <User.Name userProfile={userProfile} pubkey={item.pubkey} className="font-semibold text-foreground" />
                    <RelativeTime timestamp={item.created_at!} className="text-xs text-muted-foreground" />
                </View>

                <Pressable onPress={onReplyPress} onLongPress={copyEventId}>
                    <EventContent event={item} style={{ color: colors.foreground, paddingBottom: 8, fontSize: 13 }} />
                    <Text className="text-xs text-muted-foreground">Reply</Text>
                </Pressable>
            </View>

            <React
                event={item}
                inactiveColor={colors.foreground}
                reactionCount={reactions.length}
                reactedByUser={reactions.find(r => r.pubkey === currentUser?.pubkey)}
                iconSize={18}
                showReactionCount={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        padding: 8,
    },
    avatar: {
        paddingRight: 8,
    }
});