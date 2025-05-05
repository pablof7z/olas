import { toast } from '@backpackapp-io/react-native-toast';
import { useObserver, useProfileValue } from '@nostr-dev-kit/ndk-hooks';
import { type NDKEvent, NDKKind, useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-mobile';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { replyEventAtom } from '../store';

import React from '@/components/events/React';
import { Text } from '@/components/nativewindui/Text';
import RelativeTime from '@/components/relative-time';
import EventContent from '@/components/ui/event/content';
import * as User from '@/components/ui/user';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUserFlare } from '@/lib/user/stores/flare';
import { colorWithOpacity } from '@/theme/colors';

export function Comment({ item, style }: { item: NDKEvent; style?: StyleProp<ViewStyle> }) {
    const userProfile = useProfileValue(item.pubkey, { subOpts: { skipVerification: true } });
    const [replyEvent, setReplyEvent] = useAtom(replyEventAtom);
    const { colors } = useColorScheme();
    const currentPubkey = useNDKCurrentPubkey();
    const flare = useUserFlare(item.pubkey);
    const reactions = useObserver(
        [{ kinds: [NDKKind.Reaction], '#e': [item.id] }],
        { skipVerification: true },
        [item.id]
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
        <View
            style={containerStyle}
            className={cn('transition-all duration-300', isReplying && '!bg-accent/10')}
        >
            <Pressable
                onPress={() => router.push(`/profile?pubkey=${item.pubkey}`)}
                style={styles.avatar}
            >
                <User.Avatar
                    pubkey={item.pubkey}
                    userProfile={userProfile}
                    imageSize={32}
                    flare={flare}
                    borderWidth={1}
                />
            </Pressable>

            <View className="flex-1 flex-col">
                <View className="flex-row items-center gap-1">
                    <User.Name
                        userProfile={userProfile}
                        pubkey={item.pubkey}
                        className="font-semibold text-foreground"
                    />
                    <RelativeTime
                        timestamp={item.created_at}
                        className="text-xs text-muted-foreground"
                    />
                </View>

                <Pressable onPress={onReplyPress} onLongPress={copyEventId}>
                    <EventContent
                        event={item}
                        style={{ color: colors.foreground, paddingBottom: 8, fontSize: 13 }}
                    />
                    <Text className="text-xs text-muted-foreground">Reply</Text>
                </Pressable>
            </View>

            <React
                event={item}
                inactiveColor={colors.foreground}
                reactionCount={reactions.length}
                reactedByUser={reactions.find((r) => r.pubkey === currentPubkey)}
                iconSize={18}
                showReactionCount={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        padding: 8,
    },
    avatar: {
        paddingRight: 8,
    },
});
