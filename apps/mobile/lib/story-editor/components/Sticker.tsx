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
    PromptStickerView
} from './sticker-types';
import { useStickerStore } from '../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

interface StickerProps {
    sticker: StickerType;
    onUpdate: (transform: StickerType['transform']) => void;
    onSelect: () => void;
}

// Define styles using StyleSheet.create
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    }
});

export default function Sticker({ 
    sticker, 
    onUpdate, 
    onSelect, 
}: StickerProps) {
    // Get the nextStyle function from the store
    const nextStyle = useStickerStore(state => state.nextStyle);
    
    // Shared values for transformations
    const translateX = useSharedValue(sticker.transform.translateX);
    const translateY = useSharedValue(sticker.transform.translateY);
    const scale = useSharedValue(sticker.transform.scale);
    const rotate = useSharedValue(sticker.transform.rotate);
    const savedTranslateX = useSharedValue(sticker.transform.translateX);
    const savedTranslateY = useSharedValue(sticker.transform.translateY);
    const savedScale = useSharedValue(sticker.transform.scale);
    const savedRotate = useSharedValue(sticker.transform.rotate);

    // Handle style change using the store's nextStyle function
    const handleDoubleDoubleTap = () => {
        console.log('handleDoubleDoubleTap', sticker.id);
        // Use the store's nextStyle function to update the style
        nextStyle(sticker.id);
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
            case NDKStoryStickerType.Prompt:
                return <PromptStickerView sticker={sticker} />;
            default:
                return null;
        }
    };

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.container}>
                <Animated.View style={animatedStyle}>
                    {renderContent()}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}