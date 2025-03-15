import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import {
    Canvas,
    Image as SkiaImage,
    useImage,
    Fill,
    Group,
    RoundedRect,
    Skia,
    useCanvasRef,
    Text,
    useFont,
    vec,
    type Vector,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import {
    GestureDetector,
    Gesture,
    TouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withSpring,
} from 'react-native-reanimated';
import StoryTextInput from './StoryTextInput';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryPreviewScreenProps {
    path: string;
    type: 'photo' | 'video';
    onClose: () => void;
}

export default function StoryPreview({ path, type, onClose }: StoryPreviewScreenProps) {
    const insets = useSafeAreaInsets();
    const canvasRef = useCanvasRef();
    const [canvasSize, setCanvasSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    const font = useFont(require('../../../assets/fonts/InterVariable.ttf'), 48);
    const [storyText, setStoryText] = useState("Hello world");
    const [isEditingText, setIsEditingText] = useState(false);
    
    // Use shared values for gesture handling
    const textX = useSharedValue(SCREEN_WIDTH / 2);
    const textY = useSharedValue(SCREEN_HEIGHT / 2);
    const isDragging = useSharedValue(false);
    
    // Load image for Skia
    const image = useImage(path);

    const updateTextPosition = (x: number, y: number) => {
        textX.value = x;
        textY.value = y;
    };

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            isDragging.value = true;
        })
        .onChange((event) => {
            textX.value += event.changeX;
            textY.value += event.changeY;
            runOnJS(updateTextPosition)(textX.value, textY.value);
        })
        .onFinalize(() => {
            isDragging.value = false;
        });

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            if (!isDragging.value) {
                runOnJS(setIsEditingText)(true);
            }
        });

    const gesture = Gesture.Race(panGesture, tapGesture);
    
    const handleTextEditCancel = () => {
        setIsEditingText(false);
    };

    const handleTextEditDone = (newText: string) => {
        setStoryText(newText);
        setIsEditingText(false);
    };

    const onShare = () => {
        if (canvasRef.current) {
            // Create a snapshot of the canvas
            const snapshot = canvasRef.current.makeImageSnapshot();
            if (snapshot) {
                // Convert to base64 for sharing
                const data = snapshot.encodeToBase64();
                
                // TODO: Implement proper sharing
                console.log('Share story with image:', data.substring(0, 50) + '...');
            }
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View 
                style={[styles.previewContainer, { paddingBottom: insets.bottom }]} 
                testID="preview-container"
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasSize({ width, height });
                }}
            >
                <Canvas style={styles.media} ref={canvasRef}>
                    <Fill color="black" />
                    {image && (
                        <Group>
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
                            {font && (
                                <Text
                                    x={textX.value - (font.getTextWidth(storyText) / 2)}
                                    y={textY.value}
                                    text={storyText}
                                    font={font}
                                    color="white"
                                />
                            )}
                        </Group>
                    )}
                </Canvas>
                <GestureDetector gesture={gesture}>
                    <Animated.View style={styles.textOverlay} />
                </GestureDetector>
            </View>

            <View style={[styles.header]}>
                <TouchableOpacity 
                    onPress={onClose} 
                    style={[styles.button, styles.closeButton]}
                    testID="close-button"
                >
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.textButton]}
                    testID="add-text-button"
                >
                    <Ionicons name="text" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {isEditingText && (
                <StoryTextInput
                    initialText={storyText}
                    onCancel={handleTextEditCancel}
                    onDone={handleTextEditDone}
                />
            )}

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
        top: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 2,
    },
    button: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 40,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButton: {
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
    textOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
}); 