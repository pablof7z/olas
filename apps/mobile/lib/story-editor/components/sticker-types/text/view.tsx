import React, { useCallback } from 'react';
import { Pressable, View, Text, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from "@/lib/story-editor/store";
import { getStyleFromName } from './styles';
import { useSetAtom } from 'jotai';
import { editStickerAtom } from '@/lib/story-editor/store';

// Extend ViewStyle with backgroundGradient property
interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: {
        colors: string[];
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
}

interface TextStickerViewProps {
    sticker: Sticker;
}

export default function TextStickerView({ sticker }: TextStickerViewProps) {
    const setEditSticker = useSetAtom(editStickerAtom);

    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);
    
    // Create container styles based on the selected style
    const containerStyle = selectedStyle.container as ExtendedViewStyle;
    
    // Get basic styling properties
    const padding = typeof containerStyle.padding === 'number' ? containerStyle.padding : 12;
    const borderRadius = typeof containerStyle.borderRadius === 'number' ? containerStyle.borderRadius : 8;
    const borderWidth = typeof containerStyle.borderWidth === 'number' ? containerStyle.borderWidth : 0;
    const borderColor = containerStyle.borderColor || 'transparent';
    const backgroundColor = containerStyle.backgroundColor || 'rgba(0, 0, 0, 0.7)';
    
    // Check if we have a gradient background
    const hasBackgroundGradient = containerStyle.backgroundGradient && 
        Array.isArray(containerStyle.backgroundGradient.colors) && 
        containerStyle.backgroundGradient.colors.length > 1;

    // Create text styles based on the selected style
    const textStyle = selectedStyle.text as TextStyle;
    
    // Apply default text styles if not provided
    const textColor = textStyle.color || 'white';
    const fontSize = textStyle.fontSize || 18;
    const fontWeight = textStyle.fontWeight || 'bold';
    const fontStyle = textStyle.fontStyle || 'normal';
    const textAlign = textStyle.textAlign || 'center';
    
    // Shadow properties
    const textShadowColor = textStyle.textShadowColor || 'transparent';
    const textShadowOffset = textStyle.textShadowOffset || { width: 0, height: 0 };
    const textShadowRadius = textStyle.textShadowRadius || 0;
    
    // Create view style
    const viewStyle: ViewStyle = {
        padding,
        borderRadius,
        borderWidth,
        borderColor,
        backgroundColor: hasBackgroundGradient ? 'transparent' : backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
    };
    
    // Create text style
    const formattedTextStyle: TextStyle = {
        color: textColor,
        fontSize,
        fontWeight,
        fontStyle,
        textAlign,
        textShadowColor,
        textShadowOffset,
        textShadowRadius,
        fontFamily: selectedStyle.fontFamily,
    };
    
    const handleLongPress = useCallback(() => {
        setEditSticker(sticker);
    }, [sticker, setEditSticker]);

    // If we have a text gradient specified in skiaConfig, we'll need to handle that differently
    // For now, we'll just use the first color as we can't easily do text gradients in React Native
    const skiaConfig = selectedStyle.skiaConfig || {
        colors: [textColor],
        type: 'text',
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 }
    };

    // For simple cases, use solid color from first item in gradient colors array
    if (skiaConfig.colors.length > 1) {
        formattedTextStyle.color = skiaConfig.colors[0];
    }

    // Ensure we have at least two colors for LinearGradient
    const gradientColors = containerStyle.backgroundGradient?.colors || [];
    // expo-linear-gradient requires at least 2 colors
    const defaultColors = ['#000000', '#000000'] as const;
    
    // Create a tuple of at least two colors
    const safeGradientColors = gradientColors.length >= 2 
        ? [gradientColors[0], gradientColors[1]] as const
        : defaultColors;

    return (
        <Pressable onLongPress={handleLongPress} delayLongPress={600}>
            {hasBackgroundGradient && containerStyle.backgroundGradient ? (
                <LinearGradient
                    style={viewStyle}
                    colors={safeGradientColors}
                    start={containerStyle.backgroundGradient.start || { x: 0, y: 0 }}
                    end={containerStyle.backgroundGradient.end || { x: 1, y: 1 }}
                >
                    <Text style={formattedTextStyle} ellipsizeMode="tail">
                        {sticker.value}
                    </Text>
                </LinearGradient>
            ) : (
                <View style={viewStyle}>
                    <Text style={formattedTextStyle} ellipsizeMode="tail">
                        {sticker.value}
                    </Text>
                </View>
            )}
        </Pressable>
    );
} 