import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { editStickerAtom, Sticker, useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { useAtom } from 'jotai';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function TextStickerInput() {
    const { addSticker, updateStickerValue } = useStickerStore();
    const [editSticker, setEditSticker] = useAtom(editStickerAtom) as [Sticker<NDKStoryStickerType.Text>, (sticker: Sticker<NDKStoryStickerType.Text> | null) => void];
    const [text, setText] = useState(editSticker?.value || '');
    const insets = useSafeAreaInsets();

    const handleDone = () => {
        if (!text) return;

        if (editSticker?.id) {
            updateStickerValue(editSticker.id, text.trim() || 'Tap to edit');
        } else {
            // Create new sticker
            addSticker({
                type: NDKStoryStickerType.Text,
                value: text.trim() || 'Tap to edit',
                style: 'default',
            });
        }
        setEditSticker(null);
    };

    const handleCancel = () => {
        setEditSticker(null);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { marginTop: insets.top }]}>
                <TouchableOpacity onPress={handleCancel} style={styles.button}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDone} style={styles.button}>
                    <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={text}
                    onChangeText={setText}
                    placeholder="Enter text here"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    autoFocus
                    multiline
                    maxLength={100}
                />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    textInput: {
        width: '100%',
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 50,
    },
});
