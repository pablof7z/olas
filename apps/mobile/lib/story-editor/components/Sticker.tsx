import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    runOnJS,
} from 'react-native-reanimated';
import type { Sticker as StickerType } from '../store';
import { 
    EventStickerView, 
    TextStickerView, 
    CountdownStickerView, 
    MentionStickerView,
    NostrFilterStickerView,
    PromptStickerView
} from './sticker-types';
import { NDKStoryStickerType } from '../types';
import { getNextStyleId } from '../styles/stickerStyles';

interface StickerProps {
    sticker: StickerType;
    onUpdate: (transform: StickerType['transform']) => void;
    onSelect: () => void;
    onStyleChange: (styleId: string) => void;
    isSelected: boolean;
}

// Define styles using StyleSheet.create
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    },
    selectionIndicator: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderWidth: 2,
        borderColor: '#4a8cff',
        borderRadius: 20,
        borderStyle: 'dashed',
    },
});

export default function Sticker({ 
    sticker, 
    onUpdate, 
    onSelect, 
    onStyleChange,
    isSelected 
}: StickerProps) {
    // Shared values for transformations
    const translateX = useSharedValue(sticker.transform.translateX);
    const translateY = useSharedValue(sticker.transform.translateY);
    const scale = useSharedValue(sticker.transform.scale);
    const rotate = useSharedValue(sticker.transform.rotate);
    const savedTranslateX = useSharedValue(sticker.transform.translateX);
    const savedTranslateY = useSharedValue(sticker.transform.translateY);
    const savedScale = useSharedValue(sticker.transform.scale);
    const savedRotate = useSharedValue(sticker.transform.rotate);

    // Handle style change outside of the gesture handler
    const handleDoubleDoubleTap = useCallback(() => {
        // Get the next style ID for this sticker type
        const nextStyleId = getNextStyleId(sticker.type, sticker.styleId);
        if (nextStyleId) {
            onStyleChange(nextStyleId);
        }
    }, [sticker.type, sticker.styleId, onStyleChange]);

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
            runOnJS(onUpdate)({
                translateX: translateX.value,
                translateY: translateY.value,
                scale: scale.value,
                rotate: rotate.value,
            });
        });

    // Pinch gesture for scaling
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
            runOnJS(onSelect)();
        })
        .onChange((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(onUpdate)({
                translateX: translateX.value,
                translateY: translateY.value,
                scale: scale.value,
                rotate: rotate.value,
            });
        });

    // Rotation gesture
    const rotationGesture = Gesture.Rotation()
        .onStart(() => {
            savedRotate.value = rotate.value;
            runOnJS(onSelect)();
        })
        .onChange((event) => {
            rotate.value = savedRotate.value + event.rotation;
        })
        .onEnd(() => {
            savedRotate.value = rotate.value;
            runOnJS(onUpdate)({
                translateX: translateX.value,
                translateY: translateY.value,
                scale: scale.value,
                rotate: rotate.value,
            });
        });

    // Double tap gesture for style cycling
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            runOnJS(handleDoubleDoubleTap)();
        });

    // Single tap gesture for selection
    const tapGesture = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(onSelect)();
        });

    // Compose gestures
    const gesture = Gesture.Exclusive(
        doubleTapGesture,
        Gesture.Simultaneous(
            tapGesture,
            Gesture.Simultaneous(
                panGesture,
                Gesture.Simultaneous(pinchGesture, rotationGesture)
            )
        )
    );

    // Animated style for transformations
    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotate.value}rad` },
            ],
        };
    });

    // Get the content component based on sticker type
    const renderContent = () => {
        switch (sticker.type) {
            case NDKStoryStickerType.Text:
                return <TextStickerView sticker={sticker} />;
            case NDKStoryStickerType.Pubkey:
                return <MentionStickerView sticker={sticker} />;
            case NDKStoryStickerType.Event:
                return <EventStickerView sticker={sticker} />;
            case NDKStoryStickerType.Countdown:
                return <CountdownStickerView sticker={sticker} />;
            case NDKStoryStickerType.Mention:
                return <MentionStickerView sticker={sticker} />;
            case NDKStoryStickerType.NostrFilter:
                return <NostrFilterStickerView sticker={sticker} />;
            case NDKStoryStickerType.Prompt:
                return <PromptStickerView sticker={sticker} />;
            default:
                return null;
        }
    };

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.container}>
                {isSelected && <View style={styles.selectionIndicator} />}
                <Animated.View style={animatedStyle}>
                    {renderContent()}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}