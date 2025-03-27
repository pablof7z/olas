// Import necessary components and types from libraries and files
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedImage } from '../components/animated-image';

import EventContent from '@/components/ui/event/content';
import { activeEventAtom } from '@/stores/event';

// Define the ExpandedImageScreen component to display an enlarged image
export default function ExpandedImageScreen() {
    // Extract tag and imageUri from route params
    const { tag, imageUri } = useLocalSearchParams();

    console.log('tag', tag);
    console.log('imageUri', imageUri);

    // Retrieve window dimensions
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    // Callback function to navigate back to the HomeScreen
    const goBack = useCallback(() => {
        router.back();
    }, []);

    // Add scale shared value for pinch gesture
    const baseScale = useSharedValue(1);
    const pinchScale = useSharedValue(1);
    const offset = useSharedValue({ x: 0, y: 0 });

    // Derived value for scale
    const scale = useDerivedValue(() => {
        const y = Math.abs(offset.value.y);
        return Math.max((1 - y / windowHeight) * pinchScale.value, 0.5);
    }, [windowHeight]);

    // Animated style for translation
    const translation = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: offset.value.x * 0.3 }, { translateY: offset.value.y * 0.3 }, { scale: scale.value }],
        };
    });

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            pinchScale.value = baseScale.value * e.scale;
        })
        .onEnd(() => {
            baseScale.value = pinchScale.value;
        });

    const pan = Gesture.Pan()
        .onChange((e) => {
            offset.value = {
                x: e.changeX + offset.value.x,
                y: e.changeY + offset.value.y,
            };
            if (Math.abs(offset.value.x) > 150 || Math.abs(offset.value.y) > 250) {
                runOnJS(goBack)();
            }
        })
        .onFinalize(() => {
            offset.value = withSpring(
                { x: 0, y: 0 },
                {
                    mass: 0.5,
                }
            );
        });

    const composed = Gesture.Simultaneous(pinch, pan);
    const activeEvent = useAtomValue(activeEventAtom);

    // Calculate image size
    const imageSize = windowWidth * 0.7;

    if (!activeEvent) return null;

    // Render the ExpandedImageScreen component
    return (
        <>
            {/* Render a BlurView */}
            <BlurView
                intensity={25}
                style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                }}
            />
            <GestureDetector gesture={composed}>
                <Animated.View style={styles.fillCenter}>
                    <Animated.View style={translation}>
                        {/* Render an AnimatedImage component */}
                        <AnimatedImage
                            source={{
                                uri: String(imageUri),
                            }}
                            priority="high" // Set priority for image loading
                            recyclingKey={String(imageUri)} // Set recycling key for the image
                            cachePolicy="memory-disk" // Set cache policy
                            style={{
                                height: imageSize, // Set height of the image
                                width: windowWidth * 0.9, // Set width of the image
                                borderRadius: 25, // Set border radius
                            }}
                            contentFit="cover" // Set content fit property
                        />
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(500)}>
                        <EventContent event={activeEvent} content={activeEvent.content} />
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </>
    );
}

// Define styles for the ExpandedImageScreen component
export const styles = StyleSheet.create({
    fillCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
