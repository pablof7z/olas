import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';

interface EventStickerInputProps {
    onStickerAdded: () => void;
    addNostrEventSticker: (eventId: string, title: string) => string;
}

export default function EventStickerInput({ onStickerAdded, addNostrEventSticker }: EventStickerInputProps) {
    const [eventIdInput, setEventIdInput] = useState('');
    const { colors } = useColorScheme();

    const handleEventIdChange = (text: string) => {
        setEventIdInput(text);
    };
    
    const handleAddEventSticker = () => {
        if (eventIdInput.trim()) {
            const id = eventIdInput.trim();
            const title = `Event: ${id.substring(0, 8)}...`;
            addNostrEventSticker(id, title);
            onStickerAdded();
        }
    };

    return (
        <View style={styles.eventInputContainer}>
            <Text style={styles.eventInputLabel}>Enter Nostr Event ID:</Text>
            <TextInput
                style={[styles.eventInput, { color: colors.foreground }]}
                placeholder="Event ID"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={eventIdInput}
                onChangeText={handleEventIdChange}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity 
                style={[
                    styles.addEventButton,
                    { opacity: eventIdInput.trim() ? 1 : 0.5 }
                ]}
                onPress={handleAddEventSticker}
                disabled={!eventIdInput.trim()}
            >
                <Text style={styles.addEventButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    eventInputContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    eventInputLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 12,
    },
    eventInput: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        padding: 12,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    addEventButton: {
        backgroundColor: '#0ea5e9', // blue
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addEventButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 