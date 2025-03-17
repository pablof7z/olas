import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sticker } from "@/lib/story-editor/store";
import { getStyleFromName } from './styles';
import { useSetAtom } from 'jotai';
import { editStickerAtom } from '@/lib/story-editor/store';
import { LinearGradient } from 'expo-linear-gradient';

interface TextStickerViewProps {
    sticker: Sticker;
}

export default function TextStickerView({ sticker }: TextStickerViewProps) {
    const setEditSticker = useSetAtom(editStickerAtom);
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);
    
    // Create container styles based on the selected style
    const containerStyle = selectedStyle.container;
    
    containerStyle.padding ??= 12;
    containerStyle.backgroundColor ??= 'rgba(0, 0, 0, 0.7)';
    containerStyle.borderRadius ??= 8;
    containerStyle.borderWidth ??= 0;
    containerStyle.borderColor ??= 'transparent';
    containerStyle.borderStyle ??= 'solid';
    containerStyle.shadowColor ??= 'transparent';
    containerStyle.shadowOffset ??= { width: 0, height: 0 };
    containerStyle.shadowOpacity ??= 0;
    containerStyle.shadowRadius ??= 0;
    containerStyle.elevation ??= 0;
    
    // Create text styles based on the selected style
    const textStyle = selectedStyle.text;
    textStyle.color ??= 'white';
    textStyle.fontSize ??= 18;
    textStyle.fontWeight ??= 'bold';
    textStyle.fontStyle ??= 'normal';
    textStyle.textAlign ??= 'center' as const;
    textStyle.textShadowColor ??= 'transparent';
    textStyle.textShadowOffset ??= { width: 0, height: 0 };
    textStyle.textShadowRadius ??= 0;
    
    const handleLongPress = useCallback(() => {
        setEditSticker(sticker);
    }, [sticker, setEditSticker]);

    // Determine if we need a gradient text effect
    const useTextGradient = selectedStyle.useSkia && selectedStyle.skiaConfig && selectedStyle.skiaConfig.type === 'text';
    
    // Determine if we need a gradient background
    const useGradientBackground = selectedStyle.useSkia && selectedStyle.skiaConfig && selectedStyle.skiaConfig.type === 'background';
    
    // Component to render inside the Pressable
    const renderContent = useCallback(() => {
        // If we have a gradient background
        if (useGradientBackground && selectedStyle.skiaConfig) {
            const { colors, start, end } = selectedStyle.skiaConfig;
            
            // Ensure we have at least two colors for the gradient
            const gradientColors = colors.length >= 2 ? colors : [...colors, colors[0]];
            
            return (
                <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={start}
                    end={end}
                    style={{
                        ...containerStyle,
                        backgroundColor: undefined, // Reset backgroundColor since gradient handles it
                    }}
                >
                    <Text style={textStyle}>{sticker.value}</Text>
                </LinearGradient>
            );
        }
        
        // For text gradients, we'll use a simplified approach with regular Text component
        // This is a fallback since Skia requires more complex setup
        if (useTextGradient && selectedStyle.skiaConfig) {
            const { colors } = selectedStyle.skiaConfig;
            // Set the first color of the gradient as the text color
            const gradientTextStyle = {
                ...textStyle,
                color: colors[0],
            };
            
            return (
                <View style={containerStyle}>
                    <Text style={gradientTextStyle}>{sticker.value}</Text>
                </View>
            );
        }
        
        // Regular container without gradient
        return (
            <View style={containerStyle}>
                <Text style={textStyle}>{sticker.value}</Text>
            </View>
        );
    }, [sticker, selectedStyle, containerStyle, textStyle, useGradientBackground]);
    
    return (
        <Pressable onLongPress={handleLongPress} delayLongPress={600}>
            {renderContent()}
        </Pressable>
    );
} 