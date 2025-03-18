import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Pressable, View, Text, ViewStyle, TextStyle, Dimensions, LayoutChangeEvent, Button } from 'react-native';
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
    maxWidth?: number;
    onLayout?: (event: LayoutChangeEvent) => void;
}

export default function TextStickerView({ sticker, fixedDimensions, maxWidth, onLayout }: TextStickerViewProps) {
    const selectedStyle = useMemo(() => getStyleFromName(sticker.style), [sticker.style]);
    const [needsAspectRatio, setNeedsAspectRatio] = useState(false);
    const [hasAdjustedLayout, setHasAdjustedLayout] = useState(false);
    const [fontSize, setFontSize] = useState<number | undefined>(selectedStyle.text.fontSize ?? 12);

    const containerStyle = useMemo(() => {
        const _style: ViewStyle = {
            borderWidth: 1, borderColor: 'orange',
            maxWidth,
            width: sticker.dimensions?.width,
        };

        return _style;
    }, [])

    const textStyle = useMemo(() => {
        const padding = Number(selectedStyle?.container?.padding || 0);
        let width = undefined;
        
        if (sticker.dimensions && typeof sticker.dimensions.width === 'number') {
            width = sticker.dimensions.width - padding * 2;
        }
        
        const _style: TextStyle = {
            ...selectedStyle.text,
            borderWidth: 1,
            borderColor: 'yellow',
            fontSize: fontSize,
        }

        return _style;
    }, [selectedStyle.text, fontSize])

    const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
        if (!fixedDimensions || !sticker.dimensions) return;
        
        const { height, width } = event.nativeEvent.layout;
        const desiredHeight = sticker.dimensions.height;
        const desiredWidth = sticker.dimensions.width;
        
        // Calculate current and desired aspect ratios
        const currentAspectRatio = width / height;
        const desiredAspectRatio = desiredWidth / desiredHeight;
        const aspectRatioDifference = Math.abs(currentAspectRatio - desiredAspectRatio) / desiredAspectRatio;
        
        // Check if we're within 5% of the desired aspect ratio
        if (aspectRatioDifference <= 0.05) {
            onLayout?.(event);
            return;
        }
        
        // Check if we need to adjust the height
        if (height < desiredHeight * 0.98) {  // Allow for 2% tolerance under desired height
            console.log('👀 current height is less than desired:', { 
                current: height, 
                desired: desiredHeight,
                currentFontSize: fontSize
            });
            
            // Gradually increase font size to approach the desired height
            // Use a smaller increment for finer control
            const newFontSize = (fontSize || 12) * 1.05;  // 5% increment
            
            console.log('👀 increasing font size:', { 
                from: fontSize, 
                to: newFontSize, 
                currentHeight: height,
                desiredHeight: desiredHeight,
                currentWidth: width,
                desiredWidth: desiredWidth
            });
            
            // Update font size state
            setFontSize(newFontSize);
            setNeedsAspectRatio(true);
            
            // Prevent too many adjustments
            if (hasAdjustedLayout && height >= desiredHeight * 0.95) {
                console.log('👀 close enough to desired height, stopping adjustments');
                onLayout?.(event);
                return;
            }
            
            setHasAdjustedLayout(true);
        } else if (height > desiredHeight * 1.02) {  // More than 2% over desired height
            console.log('👀 current height exceeds desired height:', {
                current: height,
                desired: desiredHeight,
                currentFontSize: fontSize
            });
            
            // If we've overshot, reduce font size slightly
            if (fontSize && fontSize > 8) {  // Don't go below minimum readable size
                const newFontSize = fontSize * 0.98;  // Small reduction
                console.log('👀 reducing font size:', {
                    from: fontSize,
                    to: newFontSize
                });
                setFontSize(newFontSize);
                setNeedsAspectRatio(true);
                setHasAdjustedLayout(true);
            } else {
                // Font size reached minimum, consider adjustments complete
                console.log('👀 reached minimum font size, stopping adjustments');
                onLayout?.(event);
            }
        } else {
            // Height is within tolerance, no adjustment needed
            console.log('👀 height is within tolerance, adjustments complete');
            onLayout?.(event);
        }
    }, [fixedDimensions, fontSize, hasAdjustedLayout, onLayout]);
    
    return (
        <View onLayout={handleTextLayout} style={[selectedStyle.container, containerStyle]}>
            <Text style={[textStyle]} adjustsFontSizeToFit>
                {sticker.value}
            </Text>
        </View>
    );
}
