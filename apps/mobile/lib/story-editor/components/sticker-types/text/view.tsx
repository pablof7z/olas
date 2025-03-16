import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sticker } from "@/lib/story-editor/store";
import { NDKStoryStickerType, StickerStyle } from '@/lib/story-editor/types';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import styles from './styles';
import { useSetAtom } from 'jotai';
import { editStickerAtom } from '@/lib/story-editor/store';

interface TextStickerViewProps {
    sticker: Sticker;
}

export default function TextStickerView({ sticker }: TextStickerViewProps) {
    const setEditSticker = useSetAtom(editStickerAtom);
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStickerStyle(NDKStoryStickerType.Text, sticker.styleId) || styles[0];
    
    // Create container styles based on the selected style
    const containerStyle = {
        padding: 12,
        backgroundColor: selectedStyle.backgroundColor || 'rgba(0, 0, 0, 0.7)',
        borderRadius: selectedStyle.borderRadius || 16,
        borderWidth: selectedStyle.borderWidth,
        borderColor: selectedStyle.borderColor,
        borderStyle: selectedStyle.borderStyle,
        shadowColor: selectedStyle.shadowColor,
        shadowOffset: selectedStyle.shadowOffset,
        shadowOpacity: selectedStyle.shadowOpacity,
        shadowRadius: selectedStyle.shadowRadius,
        elevation: selectedStyle.elevation,
    };
    
    // Create text styles based on the selected style
    const textStyle = {
        color: selectedStyle.color || 'white',
        fontSize: selectedStyle.fontSize || 18,
        fontWeight: selectedStyle.fontWeight || 'bold',
        fontStyle: selectedStyle.fontStyle || 'normal',
        textAlign: 'center' as const,
        textShadowColor: selectedStyle.textShadowColor,
        textShadowOffset: selectedStyle.textShadowOffset,
        textShadowRadius: selectedStyle.textShadowRadius,
    };
    
    const handleLongPress = () => {
        setEditSticker(sticker);
    };
    console.log('rendering text sticker')
    
    return (
        <Pressable onLongPress={handleLongPress} delayLongPress={600}>
            <View style={containerStyle}>
                <Text style={textStyle}>{sticker.content}</Text>
            </View>
        </Pressable>
    );
} 