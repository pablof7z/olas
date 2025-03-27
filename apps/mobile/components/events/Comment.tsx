import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { useCommentBottomSheet } from '@/lib/comments/bottom-sheet';
import { activeEventAtom } from '@/stores/event';

export default function Comment({
    event,
    inactiveColor,
    foregroundColor,
    iconSize = 18,
    commentedByUser,
    commentCount,
}: {
    event: NDKEvent;
    inactiveColor: string;
    foregroundColor?: string;
    iconSize?: number;
    commentedByUser?: boolean;
    commentCount?: number;
}) {
    const openComment = useCommentBottomSheet();

    const comment = () => {
        openComment(event);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={comment}>
                <MessageCircle
                    size={iconSize}
                    color={commentedByUser ? foregroundColor : inactiveColor}
                />
            </TouchableOpacity>
            {commentCount > 0 && (
                <Text style={[styles.text, { color: inactiveColor }]}>{commentCount}</Text>
            )}
        </View>
    );
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
    },
});
