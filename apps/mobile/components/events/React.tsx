import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { Heart } from "lucide-react-native";
import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";

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
    mutedColor: string;

    /**
     * Icon size
     */
    iconSize?: number;
}

export default function React({
    event,
    mutedColor,
    iconSize = 24,
    reactionCount,
    reactedByUser,
    showReactionCount = true,
}: ReactProps) {
    const react = useCallback(async () => {
        if (reactedByUser) return;
        
        const r = await event.react('+', false);
        r.tags.push(['k', event.kind.toString()]);
        await r.sign();
        r.publish();
    }, [event.id, reactedByUser]);

    return (
        <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={react}>
                <Heart
                    size={iconSize}
                    fill={reactedByUser ? 'red' : 'transparent'}
                    color={reactedByUser ? 'red' : mutedColor}
                />
            </TouchableOpacity>
            {showReactionCount && reactionCount > 0 && (
                <Text className="text-sm font-medium" style={{ color: mutedColor }}>
                    {reactionCount}
                </Text>
            )}
        </View>
    )
}