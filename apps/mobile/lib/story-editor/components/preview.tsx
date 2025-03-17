import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Image as SkiaImage, useImage, Fill, Group, RoundedRect, useCanvasRef } from '@shopify/react-native-skia';
import { useStickerStore, Sticker as StickerType, editStickerAtom } from '../store';
import Sticker from './Sticker';
import StickersBottomSheet from './StickersBottomSheet';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { TextStickerInput } from './sticker-types';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { useNDK, NDKStory, NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { uploadStory } from '../actions/upload';
import { mapStickerToNDKFormat } from '../utils';
import { debugEvent } from '@/utils/debug';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryPreviewScreenProps {
    path: string;
    type: 'photo' | 'video';
    onClose: () => void;
}

export default function StoryPreviewContent({ path, type, onClose }: StoryPreviewScreenProps) {
    const insets = useSafeAreaInsets();
    const canvasRef = useCanvasRef();
    const [canvasSize, setCanvasSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    const image = useImage(path);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

    const { stickers, updateSticker, removeSticker, addSticker } = useStickerStore();
    const stickersSheetRef = useAtomValue(stickersSheetRefAtom);
    const [editSticker, setEditSticker] = useAtom(editStickerAtom);
    const [isUploading, setIsUploading] = useState(false);
    const ndkContext = useNDK();
    const activeBlossomServer = useActiveBlossomServer();

    const isEditingText = useMemo(() => editSticker?.type === NDKStoryStickerType.Text, [editSticker]);

    const handleStickerUpdate = (id: string, transform: any) => {
        updateSticker(id, transform);
    };

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

    const handleShare = async () => {
        if (!ndkContext?.ndk) {
            Alert.alert('Error', 'NDK instance not available');
            return;
        }

        try {
            setIsUploading(true);

            const result = await uploadStory({
                path,
                type,
                ndk: ndkContext.ndk,
                blossomServer: activeBlossomServer,
                onProgress: (type, progress) => {
                    console.log(`${type} progress: ${progress}%`);
                },
            });

            if (result.success) {
                // Create NDKStory event
                const storyEvent = new NDKStory(ndkContext.ndk);

                // Set story content with the uploaded media URL
                storyEvent.content = result.mediaUrl || '';

                // Add stickers to the event
                stickers.forEach((sticker) => {
                    try {
                        // Use the utility function to map our sticker to NDK format
                        const ndkSticker = mapStickerToNDKFormat(sticker, canvasSize);
                        storyEvent.addSticker(ndkSticker);
                    } catch (error) {
                        console.error('Error adding sticker:', error);
                    }
                });

                // Publish the story event
                await storyEvent.sign();
                debugEvent(storyEvent);

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

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, borderRadius: 20, overflow: 'hidden' }]}>
            <View
                style={[styles.previewContainer, { borderRadius: 20, overflow: 'hidden' }]}
                testID="preview-container"
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasSize({ width, height });
                }}>
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

                {/* Stickers Layer */}
                {stickers.map((sticker) => {
                    console.log('Mapping sticker in preview:', sticker);
                    return (
                        <Sticker
                            key={sticker.id}
                            sticker={sticker as any}
                            onSelect={() => handleStickerSelect(sticker.id)}
                            onUpdate={(transform) => handleStickerUpdate(sticker.id, transform)}
                        />
                    );
                })}
            </View>

            <View style={[styles.header]}>
                <TouchableOpacity onPress={onClose} style={[styles.button, styles.closeButton]} testID="close-button">
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.textButton]}
                    testID="add-text-button"
                    onPress={() =>
                        setEditSticker({
                            id: '',
                            type: NDKStoryStickerType.Text,
                            value: '',
                            transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
                        })
                    }>
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
                <TouchableOpacity style={styles.shareButton} testID="share-button" onPress={handleShare} disabled={isUploading}>
                    <Ionicons name={isUploading ? 'hourglass' : 'arrow-forward-circle'} size={60} color="white" />
                </TouchableOpacity>
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
        padding: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'flex-end',
        zIndex: 2,
    },
    shareButton: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInputOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
});
