import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { sharedStyles } from '../styles';

interface EventStickerInputProps {
    onStickerAdded: () => void;
}

export default function EventStickerInput({ onStickerAdded }: EventStickerInputProps) {
    const [eventIdInput, setEventIdInput] = useState('');
    const { addSticker } = useStickerStore();
    const { ndk } = useNDK();

    const handleEventIdChange = (text: string) => {
        setEventIdInput(text);
    };

    const handleAddEventSticker = useCallback(async () => {
        if (!ndk) return;
        const id = eventIdInput.trim();
        if (!id) return;

        const event = await ndk.fetchEvent(id);
        if (!event) {
            alert('Event not found');
            return;
        }

        addSticker({
            type: NDKStoryStickerType.Event,
            value: event,
            dimensions: {
                width: 300,
                height: 150,
            },
            metadata: { event },
        });
        onStickerAdded();
    }, [ndk, eventIdInput, addSticker, onStickerAdded]);

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.label}>Enter Nostr Event ID:</Text>
            <TextInput
                style={sharedStyles.input}
                placeholder="Event ID"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={eventIdInput}
                onChangeText={handleEventIdChange}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity
                style={[sharedStyles.button, !eventIdInput.trim() && sharedStyles.buttonDisabled]}
                onPress={handleAddEventSticker}
                disabled={!eventIdInput.trim()}>
                <Text style={sharedStyles.buttonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}
