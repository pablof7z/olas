import { PostMedia } from '@/components/NewPost/MediaPreview';
import * as MediaLibrary from 'expo-media-library';

import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';

export const urlIsVideo = (url: string) => /\.(mp4|webm|ogg|m4v|mov|m3u8|ts|)$/i.test(url);

export function isPortrait(width: number, height: number) {
    return width < height;
}

/**
 * Converts a MediaLibrary.Asset to a PostMedia.
 *
 * @param asset - The media library asset to convert.
 * @returns A PostMedia representation of the asset.
 */
export async function mapAssetToPostMedia(asset: MediaLibrary.Asset): Promise<PostMedia> {
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

    if (file.exists) size = file.size;

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

export async function mapImagePickerAssetToPostMedia(asset: ImagePickerAsset): Promise<PostMedia> {
    let mediaType: 'photo' | 'video' = 'photo';
    if (asset.type === 'video') mediaType = 'video';
    else if (asset.type === 'image') mediaType = 'photo';
    
    console.log('asset', asset.type, asset);

    if (!mediaType) {
        mediaType = 'photo';
    }

    // get the size of the file
    const file = (await FileSystem.getInfoAsync(asset.uri));
    let size: number | undefined;

    if (file.exists) size = file.size;

    return {
        id: asset.uri,
        originalUri: asset.uri,
        mediaType,
        contentMode: isPortrait(asset.width, asset.height) ? 'portrait' : 'landscape',
        size,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
    };
}
