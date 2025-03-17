import { Alert } from 'react-native';
import NDK from '@nostr-dev-kit/ndk-mobile';
import { prepareMediaItem } from '@/lib/post-editor/actions/prepare';
import { uploadMedia } from '@/lib/post-editor/actions/upload';
import { PostMedia, PostMediaType } from '@/lib/post-editor/types';

interface StoryUploadParams {
    path: string;
    type: 'photo' | 'video';
    ndk: NDK;
    blossomServer: string;
    onProgress?: (type: string, progress: number) => void;
}

interface StoryUploadResult {
    success: boolean;
    mediaUrl?: string;
    error?: Error;
}

/**
 * Uploads a story media to Blossom server
 */
export async function uploadStory({ path, type, ndk, blossomServer, onProgress }: StoryUploadParams): Promise<StoryUploadResult> {
    try {
        // Convert type to PostMediaType
        const mediaType: PostMediaType = type === 'photo' ? 'image' : 'video';

        // Prepare the media for upload
        const media: PostMedia = {
            id: Date.now().toString(),
            uris: [path],
            mediaType,
            contentMode: 'portrait', // Default value, could be determined by dimensions
        };

        // Prepare media (compress, generate thumbnail, etc.)
        const preparedMedia = await prepareMediaItem(media, onProgress);

        // Upload to Blossom
        const [uploadedMedia] = await uploadMedia([preparedMedia], ndk, blossomServer);

        if (!uploadedMedia.uploadedUri) {
            throw new Error('Failed to upload media: No URL returned');
        }

        console.log('Successfully uploaded story:', uploadedMedia.uploadedUri);

        return {
            success: true,
            mediaUrl: uploadedMedia.uploadedUri,
        };
    } catch (error) {
        console.error('Error uploading story:', error);
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred'),
        };
    }
}
