import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    Canvas,
    Image as SkiaImage,
    useImage,
    Fill,
    Group,
    RoundedRect,
    rect,
} from '@shopify/react-native-skia';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SCALE_MIN = 0.5;
const SCALE_MAX = 3;

export default function StoryPreviewScreen() {
    const { path, type } = useLocalSearchParams<{ path: string; type: string }>();
    const insets = useSafeAreaInsets();
    const player = useVideoPlayer({});
    const [canvasSize, setCanvasSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

    // Format the path for local files
    const formattedPath = path?.startsWith('/') ? `file://${path}` : path;
    
    // Load image for Skia
    const image = useImage(formattedPath);
    
    // Animation values for zoom and pan
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    React.useEffect(() => {
        console.log('Preview received:', { path, formattedPath, type });
        if (type === 'video') {
            player.replace({ uri: formattedPath });
            player.play();
            player.loop = true;
        }
    }, [path, type]);

    // Gesture handlers
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            const newScale = savedScale.value * e.scale;
            scale.value = Math.min(Math.max(newScale, SCALE_MIN), SCALE_MAX);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture);

    const onClose = () => {
        router.back();
    };

    const onShare = () => {
        // TODO: Implement sharing functionality
        console.log('Share story');
    };

    return (
        <View style={[styles.container]}>
            <View style={[styles.previewContainer, { paddingBottom: insets.bottom }]} 
                testID="preview-container"
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasSize({ width, height });
                }}
            >
                {type === 'photo' ? (
                    <GestureDetector gesture={composed}>
                        <Canvas style={styles.media}>
                            <Fill color="black" />
                            {image && (
                                <Group 
                                    transform={[
                                        { translateX: translateX.value },
                                        { translateY: translateY.value },
                                        { scale: scale.value }
                                    ]}
                                >
                                    <RoundedRect
                                        x={0}
                                        y={0}
                                        width={canvasSize.width}
                                        height={canvasSize.height}
                                        r={20}
                                    >
                                        <SkiaImage
                                            image={image}
                                            fit="cover"
                                            width={canvasSize.width}
                                            height={canvasSize.height}
                                        />
                                    </RoundedRect>
                                </Group>
                            )}
                        </Canvas>
                    </GestureDetector>
                ) : (
                    <VideoView
                        style={[styles.media, styles.roundedMedia]}
                        player={player}
                        nativeControls={false}
                        contentFit="contain"
                        testID="video-player"
                    />
                )}
            </View>

            <View style={[styles.header]}>
                <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.closeButton}
                    testID="close-button"
                >
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    onPress={onShare} 
                    style={styles.shareButton}
                    testID="share-button"
                >
                    <Ionicons name="arrow-forward-circle" size={60} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    media: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    roundedMedia: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        alignItems: 'flex-end',
        zIndex: 2,
    },
    shareButton: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
}); 