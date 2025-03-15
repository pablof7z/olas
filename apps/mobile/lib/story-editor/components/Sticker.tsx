import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { Sticker as StickerType } from '../context/StickerContext';
import { getEnhancedStyleById, enhancedTextStyles } from '../styles/enhancedTextStyles';
import {
    useFonts,
    Inter_900Black,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    Pacifico_400Regular,
} from '@expo-google-fonts/pacifico';
import {
    PermanentMarker_400Regular,
} from '@expo-google-fonts/permanent-marker';
import {
    DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';

interface StickerProps {
    sticker: StickerType;
    onUpdate: (transform: StickerType['transform']) => void;
    onSelect: () => void;
    onStyleChange: (styleId: string) => void;
    isSelected: boolean;
}

const SPRING_CONFIG = {
    damping: 15,
    mass: 0.5,
    stiffness: 150,
};

// Worklet-safe function to get next style ID
const getNextStyleId = (currentStyleId: string): string => {
    'worklet';
    const styles = enhancedTextStyles;
    const currentIndex = styles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % styles.length;
    return styles[nextIndex].id;
};

export default function Sticker({ 
    sticker, 
    onUpdate, 
    onSelect, 
    onStyleChange,
    isSelected 
}: StickerProps) {
    const [fontsLoaded] = useFonts({
        Inter_900Black,
        Inter_700Bold,
        Pacifico_400Regular,
        PermanentMarker_400Regular,
        DancingScript_700Bold,
    });

    // Shared values for transformations
    const translateX = useSharedValue(sticker.transform.translateX);
    const translateY = useSharedValue(sticker.transform.translateY);
    const scale = useSharedValue(sticker.transform.scale);
    const rotate = useSharedValue(sticker.transform.rotate);
    const savedTranslateX = useSharedValue(sticker.transform.translateX);
    const savedTranslateY = useSharedValue(sticker.transform.translateY);
    const savedScale = useSharedValue(sticker.transform.scale);
    const savedRotate = useSharedValue(sticker.transform.rotate);

    const currentStyle = getEnhancedStyleById(sticker.styleId);

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
            const nextStyleId = getNextStyleId(sticker.styleId);
            runOnJS(onStyleChange)(nextStyleId);
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
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotate.value}rad` },
            ],
            padding: isSelected ? 10 : 0,
            ...currentStyle.style.container,
        };
    });

    if (!fontsLoaded) {
        return null;
    }

    const textStyle = {
        ...styles.text,
        ...currentStyle.style.text,
        ...(currentStyle.fontFamily ? { fontFamily: currentStyle.fontFamily } : {}),
    };

    const renderContent = () => (
        <Animated.Text style={textStyle}>
            {sticker.content}
        </Animated.Text>
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                {currentStyle.style.gradient ? (
                    <LinearGradient
                        colors={currentStyle.style.gradient.colors}
                        start={currentStyle.style.gradient.start}
                        end={currentStyle.style.gradient.end}
                        style={StyleSheet.absoluteFill}
                    />
                ) : null}
                {renderContent()}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    },
    text: {
        fontSize: 32,
    },
}); 