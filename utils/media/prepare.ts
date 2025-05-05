import type { PostMedia } from '@/lib/publish/types';
import { determineMimeType } from '../url';
import compressFile from './compress';
import getDimensions from './dimensions';
import generateBlurhash from './generate-blurhash';
import generateThumbnail from './generate-thumbnail';
import removeExifFromFile from './remove-exif';
import calculateSha256 from './sha256';

export type ProgressCb = (type: string, progress: number) => void;

export async function prepareMedia(
    media: PostMedia[],
    onProgress?: ProgressCb
): Promise<PostMedia[]> {
    const res: PostMedia[] = [];

    for (const m of media) {
        const output = await prepareMediaItem(m, onProgress);
        res.push(output);
    }

    return res;
}

export async function prepareMediaItem(
    media: PostMedia,
    onProgress?: ProgressCb
): Promise<PostMedia> {
    const result: PostMedia = { ...media };

    result.mimeType ??= await determineMimeType(result.uris[0]);

    try {
        await compress(result, onProgress);
        await removeExif(result);
        await thumbnail(result);
        await blurhash(result);
        await dimensions(result);
        await sha256(result);
    } catch (error) {
        console.error('Error generating metadata', error);
    }

    return result;
}

async function thumbnail(media: PostMedia): Promise<void> {
    if (!media.localUri) throw new Error('Local URI is not set');
    if (media.mediaType === 'video') {
        media.localThumbnailUri ??= await generateThumbnail(media.localUri);
    }
}

async function blurhash(media: PostMedia): Promise<void> {
    if (!media.localUri) throw new Error('Local URI is not set');
    if (media.mediaType === 'image') {
        const b = await generateBlurhash(media.localUri);
        if (b) media.blurhash = b;
    } else if (media.mediaType === 'video' && media.localThumbnailUri) {
        const b = await generateBlurhash(media.localThumbnailUri);
        if (b) media.blurhash = b;
    } else {
        throw new Error(`Invalid media type: ${media.mediaType}`);
    }
}

async function compress(media: PostMedia, onProgress?: ProgressCb): Promise<void> {
    const results = await compressFile(media.uris[0], media.mediaType, onProgress);

    if (results.duration) media.duration = results.duration;
    media.localUri = results.compressedUri;
    media.mimeType = results.mimeType;
    media.size = results.size;
}

async function sha256(media: PostMedia): Promise<void> {
    if (!media.localUri) throw new Error('Local URI is not set');
    media.localSha256 ??= await calculateSha256(media.localUri!);

    if (media.localThumbnailUri) {
        media.localThumbnailSha256 ??= await calculateSha256(media.localThumbnailUri!);
    }
}

async function removeExif(media: PostMedia): Promise<void> {
    if (!media.localUri) throw new Error('Local URI is not set');

    const location = await removeExifFromFile(media.localUri, media.mediaType);
    if (location) media.location = location;
}

async function dimensions(media: PostMedia): Promise<void> {
    if (media.width && media.height) return;

    let file = media.localUri;
    if (!media.localUri) throw new Error('Local URI is not set');

    if (media.mediaType === 'video') {
        file = media.localThumbnailUri;
    }
    if (!file) throw new Error('File is not set');

    const { width, height } = await getDimensions(file);
    media.width = width;
    media.height = height;
}
