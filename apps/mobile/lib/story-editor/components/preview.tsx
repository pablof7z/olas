import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Alert, Text, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Image as SkiaImage, useImage, Fill, Group, RoundedRect, useCanvasRef } from '@shopify/react-native-skia';
import { useStickerStore, editStickerAtom } from '../store';
import Sticker from './Sticker';
import StickersBottomSheet from './StickersBottomSheet';
import { useAtom, useAtomValue } from 'jotai';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { TextStickerInput } from './sticker-types';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { useNDK, NDKStoryStickerType, NDKStory, NDKImetaTag, NDKEvent, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { uploadStory } from '../actions/upload';
import { createAndPublishStoryEvent } from '../actions/event';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryPreviewScreenProps {
    path: string;
    type: 'photo' | 'video';
    onClose: () => void;
    onPreview?: (story: NDKStory) => void;
}

// Export a CloseButton component for reuse
export const CloseButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, styles.closeButton]} testID="close-button">
        <Ionicons name="close" size={20} color="white" />
    </TouchableOpacity>
);

export default function StoryPreviewContent({ path, type, onClose, onPreview }: StoryPreviewScreenProps) {
    const insets = useSafeAreaInsets();
    const canvasRef = useCanvasRef();
    const [canvasSize, setCanvasSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    const image = useImage(path);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
    const { stickers, removeSticker, addSticker } = useStickerStore();
    const stickersSheetRef = useAtomValue(stickersSheetRefAtom);
    const [editSticker, setEditSticker] = useAtom(editStickerAtom);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const { ndk } = useNDK();
    const activeBlossomServer = useActiveBlossomServer();

    const isEditingText = useMemo(() => editSticker?.type === NDKStoryStickerType.Text, [editSticker]);

    const videoPlayer = useVideoPlayer(type === 'video' ? path : null, player => {
        player.loop = true;
        player.play();
    });

    const handleStickerSelect = (id: string) => {
        setSelectedStickerId(id);
    };

    const handleDeleteSelected = () => {
        if (selectedStickerId) {
            removeSticker(selectedStickerId);
            setSelectedStickerId(null);
        }
    };

    const openStickersDrawer = () => {
        stickersSheetRef?.current?.present();
    };

    const handleAddTextSticker = () => {
        setEditSticker({
            id: '',
            type: NDKStoryStickerType.Text,
            value: '',
            transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
        });
    };

    const handlePreview = async () => {
        console.log('Preview button pressed', { ndk: !!ndk, onPreview: !!onPreview });
        
        if (!ndk || !onPreview) {
            Alert.alert('Error', 'Preview is not available');
            return;
        }

        try {
            setIsGeneratingPreview(true);
            console.log('Generating preview with local URI');

            // Instead of uploading, create a local imeta with the file URI
            const localImeta: NDKImetaTag = {
                url: `file://${path}`, // Use local file URI
                // We don't need other properties like hash for preview
                m: type === 'photo' ? 'image/jpeg' : 'video/mp4', // Assumed mime types
            };
            
            console.log('Local imeta created:', localImeta);

            try {
                console.log('Creating story event without publishing');
                // Create and sign the story event without publishing
                const storyEvent = await createAndPublishStoryEvent({
                    ndk: ndk,
                    imeta: localImeta,
                    path,
                    type,
                    stickers,
                    canvasSize,
                    publish: false // Don't publish the event
                });

                if (storyEvent) {
                    onPreview(storyEvent);
                } else {
                    Alert.alert('Preview Failed', 'Failed to create story preview. Please try again.');
                }
            } catch (error) {
                console.error('Error creating story preview:', error);
                Alert.alert('Preview Failed', 'Failed to create preview. Please try again.');
            }
        } catch (error) {
            console.error('Error handling story preview:', error);
            Alert.alert('Preview Failed', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleShare = async () => {
        if (!ndk) {
            Alert.alert('Error', 'NDK instance not available');
            return;
        }

        try {
            setIsUploading(true);

            const result = await uploadStory({
                path,
                type,
                ndk: ndk,
                blossomServer: activeBlossomServer,
                onProgress: (type, progress) => {
                    console.log(`${type} progress: ${progress}%`);
                },
            });

            if (result.success) {
                try {
                    // Create and publish the story event
                    await createAndPublishStoryEvent({
                        ndk: ndk,
                        imeta: result.imeta,
                        path,
                        type,
                        stickers,
                        canvasSize,
                    });
                } catch (error) {
                    console.error('Error creating and publishing story event:', error);
                    Alert.alert('Error', 'Failed to create and publish story event. Please try again.');
                }

                Alert.alert('Success', 'Story uploaded and published successfully!');
                onClose();
            } else {
                Alert.alert('Upload Failed', result.error?.message || 'Failed to upload story. Please try again.');
            }
        } catch (error) {
            console.error('Error handling story upload:', error);
            Alert.alert('Upload Failed', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const coordinatesToPaint = [
        // [0, 0, 'red'],
        // [Dimensions.get('window').width / 2, Dimensions.get('window').height / 2, 'blue'],
        // [Dimensions.get('window').width / 3, Dimensions.get('window').height / 3, 'green'],
        // [Dimensions.get('window').width / 4, Dimensions.get('window').height / 4, 'yellow'],
        // [Dimensions.get('window').width / 3, 0, 'cyan'],
    ] as [number, number, string][];

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, borderRadius: 20, overflow: 'hidden' }]}>
            <View
                style={[styles.previewContainer, { borderRadius: 20, overflow: 'hidden' }]}
                testID="preview-container"
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasSize({ width, height });
                }}>
                {type === 'photo' ? (
                    <Canvas style={styles.media} ref={canvasRef}>
                        <Fill color="black" />
                        {image && (
                            <Group>
                                <RoundedRect x={0} y={0} width={canvasSize.width} height={canvasSize.height} r={20}>
                                    <SkiaImage image={image} fit="cover" width={canvasSize.width} height={canvasSize.height} />
                                </RoundedRect>
                            </Group>
                        )}
                    </Canvas>
                ) : (
                    <VideoView
                        style={[styles.media, { borderRadius: 20 }]}
                        player={videoPlayer}
                        contentFit="cover"
                        nativeControls={false}
                    />
                )}

                {coordinatesToPaint.map(([x, y, color]) => (
                    <React.Fragment key={`${x}-${y}`}>
                        <View style={{ position: 'absolute', left: x as number, top: y as number, borderWidth: 5, width: 20, height: 20, borderColor: color }} />
                        {/* Write the text */}
                        <Text style={{ position: 'absolute', left: x as number, top: y as number, color: 'white', fontSize: 20, fontWeight: 'bold' }}>{`${x}, ${y}`}</Text>
                    </React.Fragment>
                ))}

                {/* Stickers Layer */}
                {stickers.map((sticker) => {
                    console.log('Mapping sticker in preview:', sticker);
                    return (
                        <Sticker
                            key={sticker.id}
                            sticker={sticker as any}
                            onSelect={() => handleStickerSelect(sticker.id)}
                        />
                    );
                })}
            </View>

            <View style={[styles.header]}>
                <CloseButton onPress={onClose} />
                <TouchableOpacity
                    style={[styles.button, styles.textButton]}
                    testID="add-text-button"
                    onPress={handleAddTextSticker}>
                    <Ionicons name="text" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openStickersDrawer} style={[styles.button, styles.stickersButton]} testID="add-stickers-button">
                    <Ionicons name="pricetag" size={20} color="white" />
                </TouchableOpacity>
                {selectedStickerId && (
                    <TouchableOpacity onPress={handleDeleteSelected} style={[styles.button, styles.deleteButton]} testID="delete-button">
                        <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                {onPreview && (
                    <TouchableOpacity 
                        style={styles.previewButton} 
                        testID="preview-button" 
                        onPress={handlePreview} 
                        disabled={isGeneratingPreview || isUploading}
                    >
                        <Ionicons 
                            name="eye" 
                            size={40} 
                            color={"white"} 
                        />
                    </TouchableOpacity>
                )}
                <View style={{flex: 1}} />
                {isUploading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <TouchableOpacity 
                        style={styles.shareButton} 
                        testID="share-button" 
                        onPress={handleShare} 
                        disabled={isUploading || isGeneratingPreview}
                    >
                        <Ionicons 
                            name={isUploading ? 'hourglass' : 'arrow-forward-circle'} 
                            size={60} 
                            color={isUploading || isGeneratingPreview ? "gray" : "white"} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            <StickersBottomSheet />

            {isEditingText && (
                <View style={styles.textInputOverlay}>
                    <TextStickerInput />
                </View>
            )}
        </View>
    );
}

// Add these component exports to fix the reference issues
StoryPreviewContent.CloseButton = CloseButton;

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
    stickersButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
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
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        zIndex: 2,
    },
    previewButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInputOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 100,
    },
    loadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
