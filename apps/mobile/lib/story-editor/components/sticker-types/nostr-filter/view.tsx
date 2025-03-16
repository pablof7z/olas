import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@/lib/story-editor/types';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import nostrFilterStyles from './styles';

interface NostrFilterStickerViewProps {
    sticker: Sticker;
}

export default function NostrFilterStickerView({ sticker }: NostrFilterStickerViewProps) {
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStickerStyle(NDKStoryStickerType.NostrFilter, sticker.styleId) || nostrFilterStyles[0];
    
    // Create container styles based on the selected style
    const containerStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 10,
        backgroundColor: selectedStyle.backgroundColor || 'rgba(0, 0, 0, 0.6)',
        borderRadius: selectedStyle.borderRadius || 16,
        borderWidth: selectedStyle.borderWidth,
        borderColor: selectedStyle.borderColor,
        borderStyle: selectedStyle.borderStyle as any,
        shadowColor: selectedStyle.shadowColor,
        shadowOffset: selectedStyle.shadowOffset,
        shadowOpacity: selectedStyle.shadowOpacity,
        shadowRadius: selectedStyle.shadowRadius,
        elevation: selectedStyle.elevation,
    };
    
    // Create text styles based on the selected style
    const textStyle = {
        color: selectedStyle.color || 'white',
        fontSize: selectedStyle.fontSize || 16,
        fontWeight: selectedStyle.fontWeight || 'bold',
        fontStyle: selectedStyle.fontStyle as any,
        textShadowColor: selectedStyle.textShadowColor,
        textShadowOffset: selectedStyle.textShadowOffset,
        textShadowRadius: selectedStyle.textShadowRadius,
    };
    
    // Icon color from the style
    const iconColor = selectedStyle.iconColor || 'white';
    
    return (
        <View style={containerStyle}>
            <Ionicons name="filter" size={18} color={iconColor} style={{ marginRight: 6 }} />
            <Text style={textStyle}>
                {sticker.content || 'Nostr Filter'}
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