import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sticker } from '@/lib/story-editor/context/StickerContext';

interface TextStickerViewProps {
    sticker: Sticker;
}

export default function TextStickerView({ sticker }: TextStickerViewProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{sticker.content}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
}); 