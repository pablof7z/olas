import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { MessageCircle } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { activeEventAtom } from '@/stores/event';
import { useSetAtom } from 'jotai';
import { router } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';

export default function Comment({ event, inactiveColor, foregroundColor, iconSize = 18, commentedByUser, commentCount }: { event: NDKEvent, inactiveColor: string, foregroundColor?: string, iconSize?: number, commentedByUser?: boolean, commentCount?: number }) {
    const setActiveEvent = useSetAtom(activeEventAtom);

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comments`);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={comment}>
                <MessageCircle size={iconSize} color={commentedByUser ? foregroundColor : inactiveColor} />
            </TouchableOpacity>
            {commentCount > 0 && (
                <Text style={[styles.text, { color: inactiveColor }]}>
                    {commentCount}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 5,
    },
    text: {
        fontSize: 14,
        fontWeight: 'semibold',
    }
});