import * as MediaLibrary from 'expo-media-library';

import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';
import { PostMedia, PostMediaType, Location } from '@/lib/publish/types';
import { convertHeicToJpeg, isHeicImage } from '../image-format';
import { getRealPath } from 'react-native-compressor';
import * as Exify from '@lodev09/react-native-exify';

export const imageOrVideoUrlRegexp = /https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif|\.mp4|\.mov|\.avi|\.mkv)/;

export const urlIsVideo = (url: string) => /\.(mp4|webm|ogg|m4v|mov|m3u8|ts|qt|)$/i.test(url);

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
    let mediaType: PostMediaType = 'image';
    if (asset.mediaType === 'video') mediaType = 'video';

    console.log('asset', asset.mediaType, asset);

    if (!mediaType) {
        mediaType = 'image';
    }

    // get the real path of the asset
    const realPath = await getRealPath(asset.uri, asset.mediaType === 'video' ? 'video' : 'image');

    // Check if the image is HEIC and convert if needed
    let uri = realPath;
    if (mediaType === 'image' && isHeicImage(uri)) {
        uri = await convertHeicToJpeg(uri);
    }

    // get the size of the file
    const file = await FileSystem.getInfoAsync(uri);
    let size: number | undefined;

    if (file.exists) size = file.size;

    return {
        id: asset.id ?? asset.uri,
        uris: [uri], // Use the potentially converted URI
        mediaType,
        contentMode: isPortrait(asset.width, asset.height) ? 'portrait' : 'landscape',
        size,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
    };
}

export async function mapImagePickerAssetToPostMedia(asset: ImagePickerAsset): Promise<PostMedia> {
    // Check if the image is HEIC and convert if needed
    let uri = asset.uri;
    if (asset.type === 'image' && isHeicImage(uri)) {
        uri = await convertHeicToJpeg(uri);
    }
    
    // get the size of the file
    const file = await FileSystem.getInfoAsync(uri);
    let size: number | undefined;

    if (file.exists) size = file.size;

    let duration = asset.duration ?? undefined;
    if (duration) {
        console.log('changing what is hopefully as duration in ms to seconds', duration, duration / 1000);
        duration = duration / 1000;
    }

    return {
        id: asset.uri,
        uris: [uri], // Use the potentially converted URI
        mediaType: imagePickerAssetTypeToPostType(asset.type),
        contentMode: isPortrait(asset.width, asset.height) ? 'portrait' : 'landscape',
        size,
        duration,
        width: asset.width,
        height: asset.height,
    };
}

export function imagePickerAssetTypeToPostType(type: ImagePickerAsset['type']) {
    if (type === 'image') {
        return 'image';
    } else if (type === 'video') {
        return 'video';
    } else return 'image';
}

export function postTypeToImagePickerType(type: PostMediaType) {
    if (type === 'image') {
        return 'images';
    } else if (type === 'video') {
        return 'videos';
    }
}

export interface MediaItem {
    id: string;
    uris: string[];
    type: 'image' | 'video';
}

export async function convertMediaPath(uri: string, type: 'image' | 'video'): Promise<string> {
    const path = await getRealPath(uri, type);
    return path.startsWith('file://') ? path : `file://${path}`;
}

/**
 * Extracts location data from image EXIF metadata
 * @param uri Path to the image file
 * @returns Location object or null if no location data found
 */
export async function extractLocationFromMedia(uri: string): Promise<Location | null> {
    try {
        // Handle file:// prefix for iOS
        const cleanUri = uri.startsWith('file://') ? uri.slice(7) : uri;

        console.log('extract location from media', cleanUri);
        
        // Extract EXIF data using exify
        const exifData = await Exify.readAsync(cleanUri);
        const hasLocation = exifData?.GPSLatitude !== undefined && exifData?.GPSLongitude !== undefined;

        console.log('exifData', exifData);
        
        // Check if GPS data exists
        if (hasLocation) {
            return {
                latitude: exifData.GPSLatitude!,
                longitude: exifData.GPSLongitude!
            };
        }
        
        return null;
    } catch (error) {
        console.log('Failed to extract location from media:', error);
        return null;
    }
}
