import { type NDKImetaTag, type NDKStory, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useState } from 'react';
import { Alert } from 'react-native';

import { createStoryEvent } from '../actions/event';
import { uploadStory } from '../actions/upload';
import { type Sticker, useStickerStore } from '../store';

import { useActiveBlossomServer } from '@/hooks/blossom';

interface UseStoryActionsProps {
    path: string;
    type: 'photo' | 'video';
    stickers: Sticker[];
    dimensions: { width: number; height: number };
    getDuration: () => number;
    onClose?: () => void;
}

export const useStoryActions = ({
    path,
    type,
    stickers,
    dimensions,
    getDuration,
    onClose,
}: UseStoryActionsProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const { ndk } = useNDK();
    const activeBlossomServer = useActiveBlossomServer();
    const resetStickers = useStickerStore((state) => state.reset);

    const handlePreview = async (onPreview?: (story: NDKStory) => void) => {
        if (!ndk || !onPreview) {
            Alert.alert('Error', 'Preview is not available');
            return;
        }

        try {
            // Instead of uploading, create a local imeta with the file URI
            const localImeta: NDKImetaTag = {
                url: `file://${path}`, // Use local file URI
                // We don't need other properties like hash for preview
                m: type === 'photo' ? 'image/jpeg' : 'video/mp4', // Assumed mime types
            };

            try {
                // Create and sign the story event without publishing
                const storyEvent = await createStoryEvent({
                    ndk,
                    imeta: localImeta,
                    path,
                    type,
                    stickers,
                    dimensions,
                    duration: getDuration(),
                });

                if (storyEvent) {
                    onPreview(storyEvent);
                } else {
                    Alert.alert(
                        'Preview Failed',
                        'Failed to create story preview. Please try again.'
                    );
                }
            } catch (error) {
                console.error('Error creating story preview:', error);
                Alert.alert('Preview Failed', 'Failed to create preview. Please try again.');
            }
        } catch (error) {
            console.error('Error handling story preview:', error);
            Alert.alert('Preview Failed', 'An unexpected error occurred. Please try again.');
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
                ndk,
                blossomServer: activeBlossomServer,
                onProgress: (_type, _progress) => {},
            });

            if (result.success) {
                try {
                    // Create and publish the story event
                    const event = await createStoryEvent({
                        ndk,
                        imeta: result.imeta,
                        path,
                        type,
                        stickers,
                        dimensions,
                        duration: getDuration(),
                    });
                    const _publishedEvent = await event.publish();
                    resetStickers(); // Reset sticker store after successful publication
                } catch (error) {
                    console.error('Error creating and publishing story event:', error);
                    Alert.alert(
                        'Error',
                        'Failed to create and publish story event. Please try again.'
                    );
                }

                onClose?.();
            } else {
                Alert.alert(
                    'Upload Failed',
                    result.error?.message || 'Failed to upload story. Please try again.'
                );
            }
        } catch (error) {
            console.error('Error handling story upload:', error);
            Alert.alert('Upload Failed', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return {
        isUploading,
        handlePreview,
        handleShare,
    };
};
