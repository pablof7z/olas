import { View, StyleSheet, Pressable } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

export default function ReactionPicker({ onSelect }: { onSelect: (reaction: string) => void }) {
    return (
        <View style={styles.container}>
            <Pressable style={styles.reaction} onPress={() => onSelect('+')}>
                <Text style={styles.text}>❤️</Text>
            </Pressable>
            <Pressable style={styles.reaction} onPress={() => onSelect('🫂')}>
                <Text style={styles.text}>🫂</Text>
            </Pressable>
            <Pressable style={styles.reaction} onPress={() => onSelect('🌊')}>
                <Text style={styles.text}>🌊</Text>
            </Pressable>
            <Pressable style={styles.reaction} onPress={() => onSelect('👀')}>
                <Text style={styles.text}>👀</Text>
            </Pressable>
            <Pressable style={styles.reaction} onPress={() => onSelect('🫡')}>
                <Text style={styles.text}>🫡</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 4,
        height: 50,
    },
    reaction: {
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
        fontSize: 32,
        lineHeight: 32,
    },
});
