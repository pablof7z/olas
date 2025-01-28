import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { Heart } from "lucide-react-native";
import { useCallback } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useReactionsStore } from "@/stores/reactions";

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
    reactedByUser: boolean;

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
}

export default function React({
    event,
    inactiveColor,
    iconSize = 24,
    reactionCount,
    reactedByUser,
    showReactionCount = true,
}: ReactProps) {
    const addRelatedEvent = useReactionsStore(s => s.addEvent);
    
    const react = useCallback(async () => {
        if (reactedByUser) {
            console.log('already reacted');
            return;
        }
        
        const r = await event.react('+', false);
        r.tags.push(['k', event.kind.toString()]);
        await r.sign();

        addRelatedEvent(r, true);
        
        r.publish()
            .then((relays) => {
                console.log('reacted', Array.from(relays).map(r => r.url).join(', '));
            })
            .catch(e => {
                console.error(e);
            });
    }, [event.id, reactedByUser]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={react}>
                <Heart
                    size={iconSize}
                    fill={reactedByUser ? 'red' : 'transparent'}
                    color={reactedByUser ? 'red' : inactiveColor}
                />
            </TouchableOpacity>
            {showReactionCount && reactionCount > 0 && (
                <Text style={[styles.text, { color: inactiveColor }]}>
                    {reactionCount}
                </Text>
            )}
        </View>
    )
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
    }
});