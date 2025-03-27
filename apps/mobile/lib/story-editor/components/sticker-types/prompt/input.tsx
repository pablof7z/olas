import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

import { useStickerStore } from '../../../store';

import { useColorScheme } from '@/lib/useColorScheme';

interface PromptStickerInputProps {
    onStickerAdded: () => void;
}

export default function PromptStickerInput({ onStickerAdded }: PromptStickerInputProps) {
    const [promptText, setPromptText] = useState('');
    const { colors } = useColorScheme();
    const { addSticker } = useStickerStore();

    const handlePromptTextChange = (text: string) => {
        setPromptText(text);
    };

    const handleAddPromptSticker = () => {
        if (!promptText.trim()) {
            return;
        }

        addSticker({
            type: NDKStoryStickerType.Prompt,
            value: promptText,
            styleId: 'default',
        });
        onStickerAdded();
    };

    return (
        <View style={styles.promptInputContainer}>
            <Text style={styles.promptInputLabel}>Enter your question or prompt:</Text>
            <TextInput
                style={[styles.promptInput, { color: colors.foreground }]}
                placeholder="What's your favorite..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={promptText}
                onChangeText={handlePromptTextChange}
                autoFocus
                autoCapitalize="sentences"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
            <TouchableOpacity
                style={[styles.addPromptButton, { opacity: promptText.trim() ? 1 : 0.5 }]}
                onPress={handleAddPromptSticker}
                disabled={!promptText.trim()}>
                <Text style={styles.addPromptButtonText}>Add Prompt</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    promptInputContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    promptInputLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 12,
    },
    promptInput: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        padding: 12,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
        minHeight: 100,
    },
    addPromptButton: {
        backgroundColor: '#8b5cf6', // purple
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addPromptButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
