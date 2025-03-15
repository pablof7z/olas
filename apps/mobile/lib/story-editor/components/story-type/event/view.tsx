import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/context/StickerContext';

interface EventStickerViewProps {
    sticker: Sticker;
}

export default function EventStickerView({ sticker }: EventStickerViewProps) {
    const eventId = sticker.metadata?.eventId || '';
    const shortEventId = eventId.substring(0, 8) + '...';
    
    return (
        <View style={styles.container}>
            <Ionicons name="link" size={18} color="white" style={styles.icon} />
            <Text style={styles.text}>
                {sticker.content || `Event: ${shortEventId}`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
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