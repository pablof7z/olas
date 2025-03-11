import { Blurhash } from 'react-native-blurhash';
import { Image as CompressedImage, Video as CompressedVideo } from 'react-native-compressor';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import * as Exify from '@lodev09/react-native-exify';
import { Image } from 'expo-image';
import { determineMimeType } from '@/utils/url';
import * as RNFS from 'react-native-fs';
import { PostMedia } from '../types';

type ProgressCb = (type: string, progress: number) => void;

export async function prepareMedia(media: PostMedia[], onProgress?: ProgressCb): Promise<PostMedia[]> {
    const res: PostMedia[] = [];

    for (const m of media) {
        const output = await prepareMediaItem(m, onProgress);
        console.log('prepared media', output.localUri);
        res.push(output);
    }

    console.log('prepared all media', res.map(m => m.localUri));

    return res;
}

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 1024;

/** 
 * Compresses images and videos
 */
async function compress(media: PostMedia, onProgress?: ProgressCb): Promise<void> {
    let uri: string;
    
    if (media.mediaType === 'image') {
        uri = await CompressedImage.compress(media.uris[0], {
            compressionMethod: 'auto',
            maxWidth: MAX_WIDTH,
            maxHeight: MAX_HEIGHT,
            quality: 1.0,
            progressDivider: 10,
        });
    } else if (media.mediaType === 'video') {
        uri = await CompressedVideo.compress(media.uris[0], {
            compressionMethod: 'auto',
            progressDivider: 10,
        }, (progress) => {
            onProgress?.('Compressing', progress);
        });
    } else {
        throw new Error('Invalid media type: ' + media.mediaType);
    }

    media.localUri = uri;
    media.mimeType = await determineMimeType(uri);
    media.size = await RNFS.stat(uri).then((stats) => stats.size);
}

async function removeExif(media: PostMedia): Promise<void> {
    if (!media.localUri) {
        throw new Error('Local URI is not set');
    }

    if (media.mediaType === 'image') {
        const exif = await Exify.readAsync(media.localUri!);
        const hasLocation = exif?.GPSLatitude !== undefined && exif?.GPSLongitude !== undefined;
        if (hasLocation) {
            media.location = { latitude: exif.GPSLatitude!, longitude: exif.GPSLongitude! };
            console.log('location', media.location);
            await Exify.writeAsync(media.localUri!, zeroedGpsData);
            console.log('cleaned up exif');
        }
    } else if (media.mediaType === 'video') {
        console.log('no exif to clean on video', media.localUri);
    } else {
        throw new Error('Invalid media type: ' + media.mediaType);
    }
}

async function thumbnail(media: PostMedia): Promise<void> {
    if (!media.localUri) throw new Error('Local URI is not set');
    
    if (media.mediaType === 'video') {
        const thumbnail = await getThumbnailAsync(media.localUri);
        media.localThumbnailUri = thumbnail.uri;
    } else {
        console.log('no thumbnail for images');
    }
}

async function blurhash(media: PostMedia): Promise<void> {
    if (media.blurhash) return;
    
    let blurhash: string | null;
    
    if (!media.localUri) throw new Error('Local URI is not set');

    if (media.mediaType === 'image') {
        blurhash = await generateBlurhash(media.localUri);
    } else if (media.mediaType === 'video') {
        blurhash = await generateBlurhash(media.localThumbnailUri!);
    } else {
        throw new Error('Invalid media type: ' + media.mediaType);
    }

    if (blurhash) media.blurhash = blurhash;
}

async function dimensions(media: PostMedia): Promise<void> {
    if (media.width && media.height) {
        console.log('we already have dimensions');
        return;
    }

    let file = media.localUri;
    
    if (!media.localUri) throw new Error('Local URI is not set');

    if (media.mediaType === 'video') {
        file = media.localThumbnailUri;
    }

    if (!file) throw new Error('File is not set');

    const imageData = await Image.loadAsync(media.localUri);
    media.width = imageData.width;
    media.height = imageData.height;    
}

async function sha256(media: PostMedia): Promise<void> {
    media.localSha256 ??= await RNFS.hash(media.localUri!, 'sha256');
    
    if (media.localThumbnailUri) {
        media.localThumbnailSha256 ??= await RNFS.hash(media.localThumbnailUri!, 'sha256');
    }
}

export async function prepareMediaItem(media: PostMedia, onProgress?: ProgressCb): Promise<PostMedia> {
    let result: PostMedia = { ...media };

    result.mimeType ??= await determineMimeType(result.uris[0]);

    try {
        console.log('will compress', media.uris[0]);
        await compress(result, onProgress);
        console.log('after compressing', result.localUri);
        await removeExif(result);
        console.log('after removing exif', result.localUri);
        await thumbnail(result);
        console.log('after thumbnail', result.localThumbnailUri);
        await blurhash(result);
        console.log('after blurhash', result.blurhash);
        await dimensions(result);
        console.log('after dimensions', result.width, result.height);
        await sha256(result);
        console.log('after sha256', result.localSha256);
        console.log('generated all metadata', JSON.stringify(result, null, 4));
    } catch (error) {
        console.error('Error generating metadata', error);
    }

    return result;
}

const zeroedGpsData = {
    GPSTrackRef: '0',
    GPSSpeedRef: '0',
    GPSSpeed: 0,
    GPSMapDatum: '0',
    GPSLatitudeRef: '0',
    GPSLatitude: 0,
    GPSDifferential: 0,
    GPSDestLatitudeRef: '0',
    GPSDestDistanceRef: '0',
    GPSHPositioningError: '0',
    GPSDestDistance: 0,
    GPSDestBearing: 0,
    GPSDateStamp: '0',
    GPSAltitudeRef: 0,
    GPSAltitude: 0,
    GPSDestLatitude: 0,
    GPSImgDirection: 0,
    GPSDOP: 0,
    GPSTrack: 0,
    GPSVersionID: '0',
    GPSLongitude: 0,
    GPSDestLongitudeRef: '0',
    GPSImgDirectionRef: '0',
    GPSProcessingMethod: '0',
    GPSMeasureMode: '0',
    GPSLongitudeRef: '0',
    GPSSatellites: '0',
    GPSAreaInformation: '0',
    GPSDestBearingRef: '0',
    GPSStatus: '0',
    GPSTimeStamp: '0',
    GPSDestLongitude: 0,
} as const;

async function generateBlurhash(uri: string) {
    const compressedUri = await CompressedImage.compress(uri, {
        compressionMethod: 'manual',
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.5,
    });
    
    try {
        return await Blurhash.encode(compressedUri, 7, 5);
    } catch (error) {
        console.error('Error generating blurhash', error);
        return null;
    }
}