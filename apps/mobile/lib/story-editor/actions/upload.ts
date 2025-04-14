import type NDK from '@nostr-dev-kit/ndk-mobile';
import type { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';

import { uploadMedia } from '@/lib/publish/actions/upload';
import type { PostMedia, PostMediaType } from '@/lib/publish/types';
import { prepareMediaItem } from '@/utils/media/prepare';

interface StoryUploadParams {
    path: string;
    type: 'photo' | 'video';
    ndk: NDK;
    blossomServer: string;
    onProgress?: (type: string, progress: number) => void;
}

interface StoryUploadResult {
    success: boolean;
    imeta: NDKImetaTag;
    error?: Error;
}

/**
 * Uploads a story media to Blossom server
 */
export async function uploadStory({
    path,
    type,
    ndk,
    blossomServer,
    onProgress,
}: StoryUploadParams): Promise<StoryUploadResult> {
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

        // Generate imeta tag with all required fields
        const imeta: NDKImetaTag = {
            url: uploadedMedia.uploadedUri,
            image: uploadedMedia.uploadedThumbnailUri,
            x: uploadedMedia.uploadedSha256,
            dim:
                uploadedMedia.width && uploadedMedia.height
                    ? `${uploadedMedia.width}x${uploadedMedia.height}`
                    : undefined,
            m: uploadedMedia.mimeType,
            size: uploadedMedia.size?.toString(),
        };

        // Add original hash if different from uploaded hash
        if (
            uploadedMedia.uploadedSha256 !== uploadedMedia.localSha256 &&
            uploadedMedia.localSha256
        ) {
            imeta.ox = uploadedMedia.localSha256;
        }

        return {
            success: true,
            imeta,
        };
    } catch (error) {
        console.error('Error uploading story:', error);
        return {
            success: false,
            imeta: {}, // Empty imeta object to satisfy the type requirement
            error: error instanceof Error ? error : new Error('Unknown error occurred'),
        };
    }
}
