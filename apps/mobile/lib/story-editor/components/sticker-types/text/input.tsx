import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { editStickerAtom, useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '../../../types';
import { useAtom } from 'jotai';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function TextStickerInput() {
    const { addSticker } = useStickerStore();
    const [text, setText] = useState('');
    const insets = useSafeAreaInsets();
    const [editSticker, setEditSticker] = useAtom(editStickerAtom);
    
    // Initialize text field with sticker content when editing existing sticker
    useEffect(() => {
        if (editSticker && editSticker.type === NDKStoryStickerType.Text) {
            setText(editSticker.content);
        }
    }, [editSticker]);
    
    const handleDone = () => {
        if (editSticker?.id) {
            // Update existing sticker
            const updatedSticker = {
                ...editSticker,
                content: text.trim() || 'Tap to edit'
            };
            
            // Use updateStickerContent from the store to update just the content
            useStickerStore.getState().updateStickerContent(
                editSticker.id,
                text.trim() || 'Tap to edit'
            );
        } else {
            // Create new sticker
            addSticker({
                type: NDKStoryStickerType.Text,
                content: text.trim() || 'Tap to edit',
                styleId: 'default'
            });
        }
        setEditSticker(null);
    };
    
    const handleCancel = () => {
        setEditSticker(null);
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
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
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    },
}); 