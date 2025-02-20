import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { Heart, Repeat } from "lucide-react-native";
import { useCallback } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useReactionsStore } from "@/stores/reactions";
import AvatarGroup from "../ui/user/AvatarGroup";

type RepostProps = {
    /**
     * Event the user is reacting to
     */
    event: NDKEvent;

    /**
     * Whether the user has reposted the event
     */
    repostedByUser: boolean;

    /**
     * Set of users that have reposted the event
     */
    repostedBy: Set<string>;

    /**
     * Show repost count
    /**
     * Muted color
     */
    inactiveColor: string;

    /**
     * Icon size
     */
    iconSize?: number;

    /**
     * Active color
     */
    activeColor?: string;
}

export default function Repost({
    event,
    inactiveColor,
    activeColor,
    iconSize = 18,
    repostedBy,
    repostedByUser,
}: RepostProps) {
    const addRelatedEvent = useReactionsStore(s => s.addEvent);
    
    const repost = useCallback(async () => {
        if (repostedByUser) {
            console.log('already reposted');
            return;
        }
        
        const r = await event.repost(false);
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
    }, [event.id, repostedByUser]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={repost}>
                <Repeat
                    size={iconSize}
                    color={repostedByUser ? 'green' : inactiveColor}
                />
            </TouchableOpacity>
            {repostedBy.size > 0 && (
                <AvatarGroup pubkeys={Array.from(repostedBy)} avatarSize={iconSize*0.7} threshold={iconSize} />
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