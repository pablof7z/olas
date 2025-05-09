// Importing GroupEntry type from groups module
import type { GroupEntry } from '../groups/types';

export type Location = {
    latitude: number;
    longitude: number;
};

export type PostMediaType = 'image' | 'video';

/**
 * Types for post media and metadata
 */
export type PostMedia = {
    // Basic metadata
    id: string;
    mediaType: PostMediaType;
    mimeType?: string;
    location?: Location;

    // Editing content
    // each edited version adds to the stack
    // the current version is the first in the array
    uris: string[];

    // Finalized metadata
    localUri?: string;
    localSha256?: string;

    localThumbnailUri?: string;
    localThumbnailSha256?: string;
    uploadedUri?: string;
    uploadedThumbnailUri?: string;
    uploadedSha256?: string;
    blurhash?: string;

    contentMode: 'portrait' | 'landscape' | 'square';
    duration?: number;
    size?: number;
    width?: number;
    height?: number;
};

export interface PostMetadata {
    caption: string;
    expiration?: number;
    location?: Location;
    tags?: string[];
    groups?: GroupEntry[];
    visibility?: VisibilityType;
}

export type VisibilityType = 'text-apps' | 'media-apps';

export type PostState = 'editing' | 'uploading' | 'uploaded' | 'publishing' | 'error' | string;
