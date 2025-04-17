import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import React, { useCallback, useMemo, useState, useRef, useLayoutEffect } from 'react';
import { Dimensions, type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';

import { useStickerStore } from '../store';
import {
    CountdownStickerView,
    EventStickerView,
    MentionStickerView,
    PromptStickerView,
    TextStickerView,
} from './sticker-types';

import type { Sticker as StickerType } from '@/lib/story-editor/store/index';

interface StickerProps {
    sticker: StickerType;
    onSelect: () => void;
}

// Define styles using StyleSheet.create
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    },
    debugCoordinates: {
        position: 'absolute',
        top: -50,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 4,
        borderRadius: 4,
        zIndex: 999,
    },
    debugText: {
        color: 'white',
        fontSize: 14,
    },
    contentContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

const maxWidth = Dimensions.get('window').width * 0.9;

export default function Sticker({ sticker, onSelect }: StickerProps) {
    // Get the store functions directly
    const nextStyle = useStickerStore((state) => state.nextStyle);
    const updateSticker = useStickerStore((state) => state.updateSticker);
    const updateStickerDimensions = useStickerStore((state) => state.updateStickerDimensions);

    // Add state to track sticker dimensions
    const [stickerDimensions, setStickerDimensions] = useState({ width: 0, height: 0 });
    // Store the base dimensions (without scaling)
    const baseDimensions = useRef({ width: 0, height: 0 });

    // Shared values for transformations
    const translateX = useSharedValue(sticker.transform.translateX);
    const translateY = useSharedValue(sticker.transform.translateY);
    const scale = useSharedValue(sticker.transform.scale);
    const rotate = useSharedValue(sticker.transform.rotate);
    const savedTranslateX = useSharedValue(sticker.transform.translateX);
    const savedTranslateY = useSharedValue(sticker.transform.translateY);
    const savedScale = useSharedValue(sticker.transform.scale);
    const savedRotate = useSharedValue(sticker.transform.rotate);
    const scaleFactor = 1;

    // Add a shared value for the width and height
    const width = useSharedValue(0);
    const height = useSharedValue(0);

    // Update dimensions based on current scale
    const updateDisplayedDimensions = useCallback(() => {
        if (baseDimensions.current.width > 0 && baseDimensions.current.height > 0) {
            const newWidth = baseDimensions.current.width * scale.value * scaleFactor;
            const newHeight = baseDimensions.current.height * scale.value * scaleFactor;
            setStickerDimensions({ width: newWidth, height: newHeight });
        }
    }, [scale, scaleFactor]);

    // Update store with new transform values
    const updateStickerTransform = useCallback(() => {
        const transform = {
            translateX: translateX.value,
            translateY: translateY.value,
            scale: scale.value,
            rotate: rotate.value,
        };
        updateSticker(sticker.id, transform);

        // Update dimensions in the store
        if (baseDimensions.current.width > 0 && baseDimensions.current.height > 0) {
            const scaledWidth = baseDimensions.current.width * scale.value * scaleFactor;
            const scaledHeight = baseDimensions.current.height * scale.value * scaleFactor;
            updateStickerDimensions(sticker.id, {
                width: scaledWidth,
                height: scaledHeight,
            });
        }
    }, [
        sticker.id,
        translateX,
        translateY,
        scale,
        rotate,
        updateSticker,
        updateStickerDimensions,
        scaleFactor,
    ]);

    // Handle style change using the store's nextStyle function
    const changeStyle = () => {
        // Use the store's nextStyle function to update the style
        nextStyle(sticker.id);
        onSelect();
    };

    // Pan gesture for translation
    const panGesture = Gesture.Pan()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            runOnJS(onSelect)();
        })
        .onChange((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            runOnJS(updateStickerTransform)();
        });

    // Pinch gesture for scaling
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
            runOnJS(onSelect)();
        })
        .onChange((event) => {
            scale.value = savedScale.value * event.scale;
            // Update dimensions in real-time during pinch
            runOnJS(updateDisplayedDimensions)();
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(updateStickerTransform)();
        });

    // Rotation gesture
    const rotationGesture = Gesture.Rotation()
        .onStart(() => {
            savedRotate.value = rotate.value;
            runOnJS(onSelect)();
        })
        .onChange((event) => {
            rotate.value = savedRotate.value + event.rotation * (180 / Math.PI);
        })
        .onEnd(() => {
            savedRotate.value = rotate.value;
            runOnJS(updateStickerTransform)();
        });

    // Single tap gesture for selection
    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(changeStyle)();
    });

    // Compose gestures
    const gesture = Gesture.Exclusive(
        Gesture.Simultaneous(
            tapGesture,
            Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture))
        )
    );

    // Handle layout changes to get dimensions
    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            'worklet';
            const { width: newWidth, height: newHeight } = event.nativeEvent.layout;
            if (newWidth > 0 && newHeight > 0) {
                // Store the base dimensions (without scaling)
                baseDimensions.current = { width: newWidth, height: newHeight };

                // Use a worklet to access shared values
                const currentScale = scale.value;
                const scaledWidth = newWidth * currentScale * scaleFactor;
                const scaledHeight = newHeight * currentScale * scaleFactor;

                setStickerDimensions({ width: scaledWidth, height: scaledHeight });
                width.value = scaledWidth;
                height.value = scaledHeight;

                // Update dimensions in the store with scaled values
                updateStickerDimensions(sticker.id, {
                    width: scaledWidth,
                    height: scaledHeight,
                });
            }
        },
        [sticker.id, scale, scaleFactor, updateStickerDimensions, width, height]
    );

    // Handle content layout specifically
    const handleContentLayout = useCallback(
        (event: LayoutChangeEvent) => {
            'worklet';
            const { width: newWidth, height: newHeight } = event.nativeEvent.layout;

            // Store the base dimensions (without scaling)
            baseDimensions.current = { width: newWidth, height: newHeight };

            // Use a worklet to access shared values
            const currentScale = scale.value;
            const scaledWidth = newWidth * currentScale * scaleFactor;
            const scaledHeight = newHeight * currentScale * scaleFactor;

            if (scaledWidth > 0 && scaledHeight > 0) {
                setStickerDimensions({ width: scaledWidth, height: scaledHeight });
                width.value = scaledWidth;
                height.value = scaledHeight;

                // Update dimensions in the store with scaled values
                updateStickerDimensions(sticker.id, {
                    width: scaledWidth,
                    height: scaledHeight,
                });
            }
        },
        [sticker.id, scale, scaleFactor, updateStickerDimensions, width, height]
    );

    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value * scaleFactor }],
        };
    });

    const rotationStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            maxWidth,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate.value}deg` },
            ],
        };
    });

    // Create a derived state for scaledMaxWidth to avoid direct .value access in render
    const [derivedScaledMaxWidth, setDerivedScaledMaxWidth] = useState(maxWidth);

    // Update derivedScaledMaxWidth when scale changes using a layout effect
    useLayoutEffect(() => {
        setDerivedScaledMaxWidth((maxWidth / scale.value) * scaleFactor);
    }, [scale, scaleFactor]);

    // Get the content component based on sticker type
    const renderContent = () => {
        switch (sticker.type) {
            case NDKStoryStickerType.Text:
                return (
                    <TextStickerView
                        sticker={sticker as StickerType<NDKStoryStickerType.Text>}
                        maxWidth={derivedScaledMaxWidth}
                    />
                );
            case NDKStoryStickerType.Pubkey:
                return (
                    <MentionStickerView
                        sticker={sticker as StickerType<NDKStoryStickerType.Pubkey>}
                    />
                );
            case NDKStoryStickerType.Event:
                return (
                    <EventStickerView
                        sticker={sticker as StickerType<NDKStoryStickerType.Event>}
                        maxWidth={derivedScaledMaxWidth}
                    />
                );
            case NDKStoryStickerType.Countdown:
                return <CountdownStickerView sticker={sticker} />;
            case NDKStoryStickerType.Prompt:
                return <PromptStickerView sticker={sticker} />;
            default:
                return null;
        }
    };

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={rotationStyle}>
                <Animated.View style={scaleStyle} onLayout={handleLayout}>
                    <View style={styles.contentContainer} onLayout={handleContentLayout}>
                        {renderContent()}
                    </View>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}
