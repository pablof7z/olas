import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import type { Sticker as StickerType } from '../context/StickerContext';

interface StickerProps {
    sticker: StickerType;
    onUpdate: (transform: StickerType['transform']) => void;
    onSelect: () => void;
    isSelected: boolean;
}

const SPRING_CONFIG = {
    damping: 15,
    mass: 0.5,
    stiffness: 150,
};

export default function Sticker({ sticker, onUpdate, onSelect, isSelected }: StickerProps) {
    // Shared values for transformations
    const translateX = useSharedValue(sticker.transform.translateX);
    const translateY = useSharedValue(sticker.transform.translateY);
    const scale = useSharedValue(sticker.transform.scale);
    const rotate = useSharedValue(sticker.transform.rotate);
    const savedTranslateX = useSharedValue(sticker.transform.translateX);
    const savedTranslateY = useSharedValue(sticker.transform.translateY);
    const savedScale = useSharedValue(sticker.transform.scale);
    const savedRotate = useSharedValue(sticker.transform.rotate);

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

    // Tap gesture for selection
    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(onSelect)();
    });

    // Compose gestures
    const gesture = Gesture.Simultaneous(
        tapGesture,
        Gesture.Simultaneous(
            panGesture,
            Gesture.Simultaneous(pinchGesture, rotationGesture)
        )
    );

    // Animated style for transformations
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotate.value}rad` },
            ],
            borderWidth: isSelected ? 1 : 0,
            borderColor: 'white',
            padding: isSelected ? 10 : 0,
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <Animated.Text style={styles.text}>{sticker.content}</Animated.Text>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        padding: 10,
    },
    text: {
        color: 'white',
        fontSize: 32,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
}); 