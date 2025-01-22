import { MediaLibraryItem } from '@/components/NewPost/MediaPreview';
import * as MediaLibrary from 'expo-media-library';

import * as FileSystem from 'expo-file-system';

export const urlIsVideo = (url: string) => /\.(mp4|webm|ogg|m4v|mov|m3u8|ts|)$/i.test(url);

export function isPortrait(width: number, height: number) {
    return width < height;
}

/**
 * Converts a MediaLibrary.Asset to a MediaLibraryItem.
 *
 * @param asset - The media library asset to convert.
 * @returns A MediaLibraryItem representation of the asset.
 */
export async function mapAssetToMediaLibraryItem(asset: MediaLibrary.Asset): Promise<MediaLibraryItem> {
    let mediaType: 'photo' | 'video' = 'photo';
    if (asset.type === 'video') mediaType = 'video';
    else if (asset.type === 'photo') mediaType = 'photo';
    
    console.log('asset', asset.mediaType, asset);

    if (!mediaType) {
        mediaType = 'photo';
    }

    // get the size of the file
    const file = (await FileSystem.getInfoAsync(asset.uri));
    let size: number | undefined;

    if (file.exists) {
        size = file.size;
    }
    
    console.log('file', JSON.stringify(file, null, 4));

    return {
        id: asset.id ?? asset.uri,
        uri: asset.uri,
        mediaType,
        contentMode: isPortrait(asset.width, asset.height) ? 'portrait' : 'landscape',
        size,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
    };
}