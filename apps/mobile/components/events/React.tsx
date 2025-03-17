import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { Heart } from 'lucide-react-native';
import { useCallback } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useReactionsStore } from '@/stores/reactions';
import { useReactionPicker } from '@/lib/reaction-picker/hook';

type ReactProps = {
    /**
     * Event the user is reacting to
     */
    event: NDKEvent;

    /**
     * Reaction count
     */
    reactionCount: number;

    /**
     * Whether the user has reacted to the event
     */
    reactedByUser: NDKEvent | undefined;

    /**
     * Show reaction count
     */
    showReactionCount?: boolean;

    /**
     * Muted color
     */
    inactiveColor: string;

    /**
     * Icon size
     */
    iconSize?: number;
};

export function useReactEvent() {
    const addRelatedEvents = useReactionsStore((s) => s.addEvents);

    const react = useCallback(
        async (event: NDKEvent, reaction: string = '+') => {
            const r = await event.react(reaction, false);
            r.tags.push(['k', event.kind.toString()]);
            await r.sign();

            addRelatedEvents([r], true);

            r.publish()
                .then((relays) => {})
                .catch((e) => {
                    console.error(e);
                });
        },
        [addRelatedEvents]
    );

    return { react };
}

export default function React({ event, inactiveColor, iconSize = 18, reactionCount, reactedByUser, showReactionCount = true }: ReactProps) {
    const { react } = useReactEvent();
    const handlePress = useCallback(() => {
        if (reactedByUser) return;

        react(event);
    }, [react, event?.id, reactedByUser]);

    const openReactionPicker = useReactionPicker();

    const handleLongPress = useCallback(() => {
        openReactionPicker().then((reaction) => react(event, reaction));
    }, [react, event?.id, reactedByUser]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePress} onLongPress={handleLongPress}>
                {!reactedByUser || reactedByUser.content === '+' ? (
                    <Heart size={iconSize} fill={reactedByUser ? 'red' : 'transparent'} color={reactedByUser ? 'red' : inactiveColor} />
                ) : (
                    <Text style={[styles.text, { fontSize: iconSize, lineHeight: iconSize, color: inactiveColor }]}>
                        {reactedByUser.content}
                    </Text>
                )}
            </TouchableOpacity>
            {showReactionCount && reactionCount > 0 && <Text style={[styles.text, { color: inactiveColor }]}>{reactionCount}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: 14,
        fontWeight: 'semibold',
    },
});
