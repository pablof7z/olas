import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Checks if a file is in HEIC format based on its URI
 * @param uri File URI to check
 * @returns True if the file is HEIC format
 */
export function isHeicImage(uri: string): boolean {
    return uri.toLowerCase().endsWith('.heic');
}

/**
 * Converts a HEIC image to JPEG format
 * @param uri URI of the image file
 * @returns Promise resolving to the URI of the converted image (same URI if not HEIC)
 */
export async function convertHeicToJpeg(uri: string): Promise<string> {
    if (isHeicImage(uri)) {
        try {
            const result = await ImageManipulator.manipulateAsync(uri, [], {
                format: ImageManipulator.SaveFormat.JPEG,
            });
            return result.uri;
        } catch (error) {
            console.error('Error converting HEIC to JPEG:', error);
            return uri; // Return original URI if conversion fails
        }
    }
    return uri;
}

/**
 * Converts an array of image URIs, converting any HEIC images to JPEG format
 * @param uris Array of image URIs
 * @returns Promise resolving to an array of converted image URIs
 */
export async function convertHeicUrisToJpeg(uris: string[]): Promise<string[]> {
    return Promise.all(uris.map((uri) => convertHeicToJpeg(uri)));
}

/**
 * Gets file info including mime type and file size
 * @param uri URI of the file
 * @returns Promise resolving to an object with file info
 */
export async function getFileInfo(uri: string): Promise<{
    exists: boolean;
    size?: number;
    mimeType?: string;
}> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        return {
            exists: fileInfo.exists,
            size: fileInfo.size,
            mimeType: getMimeTypeFromUri(uri),
        };
    } catch (error) {
        console.error('Error getting file info:', error);
        return { exists: false };
    }
}

/**
 * Gets the MIME type from a file URI based on extension
 * @param uri URI of the file
 * @returns MIME type string or undefined if not recognized
 */
function getMimeTypeFromUri(uri: string): string | undefined {
    const extension = uri.split('.').pop()?.toLowerCase();
    if (!extension) return undefined;

    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        heic: 'image/heic',
        heif: 'image/heif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        webm: 'video/webm',
    };

    return mimeTypes[extension];
}
