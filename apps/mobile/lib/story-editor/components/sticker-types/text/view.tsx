import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { LinearGradient } from 'expo-linear-gradient';
import { useSetAtom } from 'jotai';
import React, { useCallback, useState, useEffect, useMemo, useRef, cloneElement } from 'react';
import { Pressable, View, Text, ViewStyle, TextStyle, Dimensions, LayoutChangeEvent, Button } from 'react-native';

import { getStyleFromName } from './styles';

import { editStickerAtom } from '@/lib/story-editor/store';
import { Sticker } from '@/lib/story-editor/store/index';

// Extend ViewStyle with backgroundGradient property
interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: {
        colors: string[];
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
    padding?: number;
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
            maxWidth,
            width: sticker.dimensions?.width,
        };

        return _style;
    }, []);

    // Check if container is a component (function) or a style object
    const isContainerComponent = useMemo(() => {
        return typeof selectedStyle.container === 'function';
    }, [selectedStyle.container]);

    const textStyle = useMemo(() => {
        let padding = 0;

        // Only try to access padding if container is a style object
        if (!isContainerComponent && selectedStyle.container) {
            padding = Number((selectedStyle.container as ExtendedViewStyle)?.padding || 0);
        }

        let width = undefined;

        if (sticker.dimensions && typeof sticker.dimensions.width === 'number') {
            width = sticker.dimensions.width - padding * 2;
        }

        const _style: TextStyle = {
            ...selectedStyle.text,
            fontSize,
        };

        return _style;
    }, [selectedStyle.text, fontSize, isContainerComponent]);

    const handleTextLayout = useCallback(
        (event: LayoutChangeEvent) => {
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
            if (height < desiredHeight * 0.98) {
                // Allow for 2% tolerance under desired height
                console.log('👀 current height is less than desired:', {
                    current: height,
                    desired: desiredHeight,
                    currentFontSize: fontSize,
                });

                // Gradually increase font size to approach the desired height
                // Use a smaller increment for finer control
                const newFontSize = (fontSize || 12) * 1.05; // 5% increment

                console.log('👀 increasing font size:', {
                    from: fontSize,
                    to: newFontSize,
                    currentHeight: height,
                    desiredHeight,
                    currentWidth: width,
                    desiredWidth,
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
            } else if (height > desiredHeight * 1.02) {
                // More than 2% over desired height
                console.log('👀 current height exceeds desired height:', {
                    current: height,
                    desired: desiredHeight,
                    currentFontSize: fontSize,
                });

                // If we've overshot, reduce font size slightly
                if (fontSize && fontSize > 8) {
                    // Don't go below minimum readable size
                    const newFontSize = fontSize * 0.98; // Small reduction
                    console.log('👀 reducing font size:', {
                        from: fontSize,
                        to: newFontSize,
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
        },
        [fixedDimensions, fontSize, hasAdjustedLayout, onLayout]
    );

    // Check if the container style has a background gradient
    const hasBackgroundGradient = useMemo(() => {
        if (isContainerComponent) return false;
        return !!(selectedStyle.container as ExtendedViewStyle)?.backgroundGradient;
    }, [selectedStyle.container, isContainerComponent]);

    // Extract the gradient properties
    const gradientProps = useMemo(() => {
        if (!hasBackgroundGradient) return null;

        const { backgroundGradient } = selectedStyle.container as ExtendedViewStyle;
        // Ensure we have at least two colors for the gradient
        const colors =
            backgroundGradient!.colors.length >= 2
                ? (backgroundGradient!.colors as [string, string, ...string[]])
                : (['rgba(0,0,0,0)', 'rgba(0,0,0,0)'] as [string, string]);

        return {
            colors,
            start: backgroundGradient!.start || { x: 0, y: 0 },
            end: backgroundGradient!.end || { x: 1, y: 1 },
        };
    }, [selectedStyle.container, hasBackgroundGradient]);

    // Create a style without the backgroundGradient property for the LinearGradient component
    const containerStyleWithoutGradient = useMemo(() => {
        if (!hasBackgroundGradient || isContainerComponent) return {};

        const { backgroundGradient, ...rest } = selectedStyle.container as ExtendedViewStyle;
        return rest;
    }, [selectedStyle.container, hasBackgroundGradient, isContainerComponent]);

    // Render component based on container type
    if (isContainerComponent) {
        // Get the component from the container function
        const containerElement = (selectedStyle.container as () => React.ReactNode)();

        // We need to clone the element to add our text as children
        return (
            <View style={containerStyle} onLayout={handleTextLayout}>
                {React.cloneElement(
                    containerElement as React.ReactElement,
                    {},
                    <Text style={[textStyle]} adjustsFontSizeToFit>
                        {sticker.value}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <>
            {hasBackgroundGradient && gradientProps ? (
                <LinearGradient
                    colors={gradientProps.colors}
                    start={gradientProps.start}
                    end={gradientProps.end}
                    style={[containerStyleWithoutGradient as ViewStyle, containerStyle]}
                    onLayout={handleTextLayout}>
                    <Text style={[textStyle]} adjustsFontSizeToFit>
                        {sticker.value}
                    </Text>
                </LinearGradient>
            ) : (
                <View onLayout={handleTextLayout} style={[selectedStyle.container as ViewStyle, containerStyle]}>
                    <Text style={[textStyle]} adjustsFontSizeToFit>
                        {sticker.value}
                    </Text>
                </View>
            )}
        </>
    );
}
