import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/context/StickerContext';

interface MentionStickerViewProps {
    sticker: Sticker;
}

export default function MentionStickerView({ sticker }: MentionStickerViewProps) {
    return (
        <View style={styles.container}>
            <Ionicons name="at" size={18} color="white" style={styles.icon} />
            <Text style={styles.text}>{sticker.content}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 