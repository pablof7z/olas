import React, { useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { Sticker as StickerType } from '../context/StickerContext';
import { getStickerStyleById, getNextStickerStyleId } from '../styles/stickerStyles';
import {
    useFonts,
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black,
} from '@expo-google-fonts/inter';
import {
    Pacifico_400Regular,
} from '@expo-google-fonts/pacifico';
import {
    PermanentMarker_400Regular,
} from '@expo-google-fonts/permanent-marker';
import {
    DancingScript_400Regular,
    DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import {
    Anton_400Regular,
} from '@expo-google-fonts/anton';
import {
    Caveat_400Regular,
    Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import {
    Oswald_400Regular,
    Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import { MentionSticker, NostrEventSticker, TextSticker, CountdownSticker, NostrFilterSticker } from './sticker-types';
import PromptSticker from './sticker-types/PromptSticker';

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
    debugLabel: {
        position: 'absolute',
        top: 5,
        left: 5,
        right: 5,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 9,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 9999,
    },
});

export default function Sticker({ 
    sticker, 
    onUpdate, 
    onSelect, 
    onStyleChange,
    isSelected 
}: StickerProps) {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
        Inter_900Black,
        Pacifico_400Regular,
        PermanentMarker_400Regular,
        DancingScript_400Regular,
        DancingScript_700Bold,
        Anton_400Regular,
        Caveat_400Regular,
        Caveat_700Bold,
        Oswald_400Regular,
        Oswald_700Bold,
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

    const currentStyle = getStickerStyleById(sticker.type, sticker.styleId);
    
    // Create custom font style if there's a fontFamily
    const customFontStyle = currentStyle.fontFamily 
        ? { fontFamily: currentStyle.fontFamily }
        : {};

    // Handle style change outside of the gesture handler
    const handleStyleChange = useCallback(() => {
        onSelect();
        const nextStyleId = getNextStickerStyleId(sticker.type, sticker.styleId);
        onStyleChange(nextStyleId);
    }, [sticker.type, sticker.styleId, onSelect, onStyleChange]);

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
            runOnJS(handleStyleChange)();
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
            ...(currentStyle && currentStyle.style && currentStyle.style.container ? currentStyle.style.container : {}),
        };
    });

    if (!fontsLoaded) {
        return null;
    }

    // Get the content component based on sticker type
    const renderContent = () => {
        switch (sticker.type) {
            case 'text':
                return <TextSticker sticker={sticker} textStyle={customFontStyle} />;
            case 'mention':
                return <MentionSticker sticker={sticker} textStyle={customFontStyle} />;
            case 'nostrEvent':
                return <NostrEventSticker sticker={sticker} textStyle={customFontStyle} />;
            case 'countdown':
                return <CountdownSticker sticker={sticker} />;
            case 'nostrFilter':
                return <NostrFilterSticker sticker={sticker} textStyle={customFontStyle} />;
            case 'prompt':
                return <PromptSticker sticker={sticker} textStyle={customFontStyle} />;
            default:
                return null;
        }
    };

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.container}>
                {isSelected && <View style={styles.selectionIndicator} />}
                
                <Animated.View style={animatedStyle}>
                    {currentStyle && currentStyle.style && currentStyle.style.gradient ? (
                        <LinearGradient
                            colors={currentStyle.style.gradient.colors}
                            start={currentStyle.style.gradient.start}
                            end={currentStyle.style.gradient.end}
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null}
                    {renderContent()}
                    
                    {/* Debug label inside the sticker at the top */}
                    {currentStyle && (
                        <Text style={styles.debugLabel}>
                            {sticker.type}: {currentStyle.name || currentStyle.id}
                        </Text>
                    )}
                </Animated.View>
            </View>
        </GestureDetector>
    );
} 