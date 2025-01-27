import { NDKEvent, NDKUser, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { MessageCircle } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { activeEventAtom } from '@/stores/event';
import { useSetAtom } from 'jotai';
import { router } from 'expo-router';
import { useObserver } from '@/hooks/observer';
import { Text } from '@/components/nativewindui/Text';

export default function Comment({ event, mutedColor, foregroundColor, iconSize = 24, commentedByUser, commentCount }: { event: NDKEvent, mutedColor: string, foregroundColor?: string, iconSize?: number, commentedByUser?: boolean, commentCount?: number }) {
    const start = performance.now();
    const setActiveEvent = useSetAtom(activeEventAtom);

    const allComments = useObserver([
        { kinds: [NDKKind.Text], ...event.filter() },
        { kinds: [NDKKind.GenericReply], ...event.nip22Filter() },
    ], [event.id])

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comments`);
    };

    return (
        <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.reactionButton} onPress={comment}>
                <MessageCircle size={iconSize} color={commentedByUser ? foregroundColor : mutedColor} />
            </TouchableOpacity>
            {commentCount > 0 && (
                <Text className="text-sm font-medium" style={{ color: mutedColor }}>
                    {commentCount}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});
