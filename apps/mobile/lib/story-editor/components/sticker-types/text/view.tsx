import React, { useCallback, useState, useEffect } from 'react';
import { Pressable, View, Text, ViewStyle, TextStyle, Dimensions, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from '@/lib/story-editor/store/index';
import { getStyleFromName } from './styles';
import { useSetAtom } from 'jotai';
import { editStickerAtom } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

// Extend ViewStyle with backgroundGradient property
interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: {
        colors: string[];
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
}

interface TextStickerViewProps {
    sticker: Sticker<NDKStoryStickerType.Text>;
    fixedDimensions?: boolean;
}

export default function TextStickerView({ sticker, fixedDimensions }: TextStickerViewProps) {
    const setEditSticker = useSetAtom(editStickerAtom);
    const [containerSize, setContainerSize] = useState(fixedDimensions ? sticker.dimensions : { width: 0, height: 0 });
    const [adjustedFontSize, setAdjustedFontSize] = useState<number | null>(null);

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
    const hasBackgroundGradient =
        containerStyle.backgroundGradient &&
        Array.isArray(containerStyle.backgroundGradient.colors) &&
        containerStyle.backgroundGradient.colors.length > 1;

    // Create text styles based on the selected style
    const textStyle = selectedStyle.text as TextStyle;

    // Apply default text styles if not provided
    const textColor = textStyle.color || 'white';
    const initialFontSize = textStyle.fontSize || 18;
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
        width: fixedDimensions ? containerSize.width : '100%',
        height: fixedDimensions ? containerSize.height : '100%',
        backgroundColor: hasBackgroundGradient ? 'transparent' : backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
    };

    // Handle container layout to measure available space
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        if (fixedDimensions) return;
        const { width, height } = event.nativeEvent.layout;
        console.log('handleLayout', { width, height });
        setContainerSize({ width, height });
    }, [fixedDimensions]);

    // Calculate adjusted font size based on text length and container size
    useEffect(() => {
        if (containerSize.width <= 0 || containerSize.height <= 0 || !sticker.value) {
            return;
        }

        // Starting with a larger font size based on container dimensions
        const availableWidth = containerSize.width;
        const availableHeight = containerSize.height;
        
        // Estimate characters per line based on average character width (approximation)
        const avgCharWidth = initialFontSize * 0.6;
        const textLength = sticker.value.length;
        
        // Calculate a font size that would fit width-wise
        const maxFontSizeByWidth = availableWidth / (textLength * 0.6) * 1.8;
        
        // Ensure the text height also fits within container
        const estimatedLines = Math.ceil((textLength * avgCharWidth) / availableWidth);
        const maxFontSizeByHeight = availableHeight / (estimatedLines * 1.3); // 1.3 is line height factor
        
        // Use the smaller of the two calculated sizes to ensure fitting in both dimensions
        const calculatedFontSize = Math.min(maxFontSizeByWidth, maxFontSizeByHeight, initialFontSize * 2);
        
        // Set a reasonable floor and ceiling
        const finalFontSize = Math.max(8, Math.min(calculatedFontSize, 72));

        console.log('calculatedFontSize', { containerSize, finalFontSize, padding: padding / 4, maxFontSizeByWidth, maxFontSizeByHeight, availableWidth, availableHeight, textLength, estimatedLines });
        
        setAdjustedFontSize(finalFontSize);
    }, [containerSize, sticker.value, initialFontSize, padding]);

    // Create text style with adjusted font size if available
    const formattedTextStyle: TextStyle = {
        color: textColor,
        fontWeight,
        fontStyle,
        textAlign,
        fontSize: false ? ( adjustedFontSize || initialFontSize) : textStyle.fontSize,
    
        textShadowColor,
        textShadowOffset,
        textShadowRadius,
        fontFamily: selectedStyle.fontFamily,
        alignItems: 'center',
        justifyContent: 'center',
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
        end: { x: 1, y: 0 },
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
    const safeGradientColors = gradientColors.length >= 2 ? ([gradientColors[0], gradientColors[1]] as const) : defaultColors;

    return (
        <Pressable onLongPress={handleLongPress} delayLongPress={600}>
            {hasBackgroundGradient && containerStyle.backgroundGradient ? (
                <LinearGradient
                    style={viewStyle}
                    colors={safeGradientColors}
                    start={containerStyle.backgroundGradient.start || { x: 0, y: 0 }}
                    end={containerStyle.backgroundGradient.end || { x: 1, y: 1 }}
                    onLayout={handleLayout}>
                    <Text style={formattedTextStyle} adjustsFontSizeToFit numberOfLines={0}>
                        {sticker.value}
                    </Text>
                </LinearGradient>
            ) : (
                <View style={viewStyle} onLayout={handleLayout}>
                    <Text style={formattedTextStyle} adjustsFontSizeToFit numberOfLines={0}>
                        {sticker.value}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}
