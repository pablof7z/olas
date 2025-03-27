import { Ionicons } from '@expo/vector-icons';
import type { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { useVideoPlayer } from 'expo-video';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMediaDimensions } from '../hooks/useMediaDimensions';
import { useStickerManagement } from '../hooks/useStickerManagement';
import { useStoryActions } from '../hooks/useStoryActions';
import { useStickerStore } from '../store';
import CloseButton from './CloseButton';
import MediaRenderer from './MediaRenderer';
import Sticker from './Sticker';
import StickersBottomSheet from './StickersBottomSheet';
import StoryControls from './StoryControls';
import SettingsBottomSheet from './settings';
import { TextStickerInput } from './sticker-types';

interface StoryPreviewScreenProps {
    path: string;
    type: 'photo' | 'video';
    onClose: () => void;
    onPreview?: (story: NDKStory) => void;
}

const dimensions = Dimensions.get('window');

export default function StoryPreviewContent({
    path,
    type,
    onClose,
    onPreview,
}: StoryPreviewScreenProps) {
    const insets = useSafeAreaInsets();
    const { getDuration } = useStickerStore();

    // Use extracted custom hooks
    const { setCanvasSize, containerWidthValue, onImageLoad, setMediaSize } = useMediaDimensions();

    const {
        selectedStickerId,
        stickers,
        isEditingText,
        handleStickerSelect,
        handleDeleteSelected,
        openStickersDrawer,
        handleAddTextSticker,
    } = useStickerManagement();

    const { isUploading, handlePreview, handleShare } = useStoryActions({
        path,
        type,
        stickers,
        dimensions,
        getDuration,
        onClose,
    });

    const videoPlayer = useVideoPlayer(type === 'video' ? path : null, (player) => {
        player.loop = true;
        player.play();
    });

    // Get video dimensions when available
    useEffect(() => {
        if (type === 'video' && videoPlayer) {
            const checkDimensions = setInterval(() => {
                // Check for natural size properties on VideoPlayer
                const naturalWidth = (videoPlayer as any).naturalWidth;
                const naturalHeight = (videoPlayer as any).naturalHeight;

                if (naturalWidth > 0 && naturalHeight > 0) {
                    setMediaSize({ width: naturalWidth, height: naturalHeight });
                    clearInterval(checkDimensions);
                }
            }, 100);

            return () => clearInterval(checkDimensions);
        }
    }, [videoPlayer, type]);

    // Use handlePreview from our hook
    const onPreviewPress = async () => {
        await handlePreview(onPreview);
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    borderRadius: 20,
                    overflow: 'hidden',
                },
            ]}
        >
            <View
                style={[styles.previewContainer, { borderRadius: 20, overflow: 'hidden' }]}
                testID="preview-container"
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasSize({ width, height });
                }}
            >
                <MediaRenderer
                    type={type}
                    path={path}
                    player={videoPlayer}
                    containerWidthValue={containerWidthValue}
                    onImageLoad={onImageLoad}
                />

                {/* Stickers Layer */}
                {stickers.map((sticker) => (
                    <Sticker
                        key={sticker.id}
                        sticker={sticker as any}
                        onSelect={() => handleStickerSelect(sticker.id)}
                    />
                ))}
            </View>

            <StoryControls
                insets={insets}
                onClose={onClose}
                onAddText={handleAddTextSticker}
                onOpenStickers={openStickersDrawer}
                onDeleteSelected={handleDeleteSelected}
                onPreview={onPreviewPress}
                onShare={handleShare}
                isUploading={isUploading}
                selectedStickerId={selectedStickerId}
                showPreviewButton={!!onPreview && false}
            />

            <StickersBottomSheet />
            <SettingsBottomSheet />

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
    button: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 40,
    },
    previewContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
});
