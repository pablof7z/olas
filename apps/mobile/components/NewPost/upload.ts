import { MediaLibraryItem } from './MediaPreview';
import * as FileSystem from 'expo-file-system';
import { Image as CompressedImage } from 'react-native-compressor';
import NDK from '@nostr-dev-kit/ndk-mobile';
import * as Exify from '@lodev09/react-native-exify';
import { Image } from 'expo-image';
import { determineMimeType } from './AlbumsView';
import * as RNFS from 'react-native-fs';
import { Uploader } from '@/utils/uploader';
import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
import { BlobDescriptor } from '@/utils';

export async function uploadMedia(
    media: MediaLibraryItem[],
    ndk: NDK,
    blossomServer: string = DEFAULT_BLOSSOM_SERVER
): Promise<MediaLibraryItem[]> {
    const mediaItems = [...media];

    for (const m of mediaItems) {
        console.log('uploading', m.uri);
        await new Promise<void>((resolve, reject) => {
            const uploader = new Uploader(ndk, m.uri, m.mimeType, blossomServer);
            uploader.onUploaded = (data: BlobDescriptor) => {
                m.uploadedUri = data.url;
                m.uploadedSha256 = data.sha256;
                resolve();
            };
            uploader.onError = (error) => {
                reject(error);
            };
            uploader.start();
        });
    }

    return mediaItems;
}

export async function prepareMedia(media: MediaLibraryItem[]): Promise<MediaLibraryItem[]> {
    debugger;
    const res = [];

    for (const m of media) {
        const input = m;
        const output = await prepareMediaItem(m);
        res.push(output);
    }

    return res;
}

export async function prepareMediaItem(media: MediaLibraryItem): Promise<MediaLibraryItem> {
    let { mimeType, blurhash } = media;

    if (!mimeType) mimeType = await determineMimeType(media.uri);

    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newUri = FileSystem.cacheDirectory + randomId + '.jpg';

    await FileSystem.copyAsync({ from: media.uri, to: newUri });

    const exif = await Exify.readAsync(newUri);
    console.log('exif', exif);
    const hasLocation = exif.GPSLatitude !== undefined && exif.GPSLongitude !== undefined;
    const location = hasLocation ? { latitude: exif.GPSLatitude, longitude: exif.GPSLongitude } : undefined;

    const start = performance.now();
    // const compressedUri = await CompressedImage.compress(newUri, {
    //     compressionMethod: 'auto',
    //     maxWidth: 2048,
    //     maxHeight: 1024,
    //     quality: 1.0,
    //     progressDivider: 10,
    //     downloadProgress: (progress) => {
    //         console.log('downloadProgress: ', progress);
    //     },
    // });
    const compressedUri = newUri;
    const end = performance.now();
    console.log('compressed file', compressedUri);
    console.log('time to compress real file', end - start);

    // zero-out the gps data
    await Exify.writeAsync(compressedUri, zeroedGpsData);

    // getting sha256
    const sha256 = await RNFS.hash(compressedUri, 'sha256');
    console.log('sha256', sha256);

    if (!blurhash) {
        try {
            blurhash = await generateBlurhash(compressedUri);
        } catch (error) {
            console.error('Error generating blurhash', error);
        }
    }

    return {
        ...media,
        uri: compressedUri,
        sha256,
        blurhash,
        mimeType,
        location,
    };
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
    const start = performance.now();
    const compressedUri = await CompressedImage.compress(uri, {
        compressionMethod: 'manual',
        maxWidth: 50,
        maxHeight: 50,
        quality: 0.1,
        progressDivider: 10,
        downloadProgress: (progress) => {
            console.log('downloadProgress: ', progress);
        },
    });
    const end = performance.now();
    console.log('compressed file', compressedUri);
    console.log('time to compress', end - start);

    const start2 = performance.now();
    const blurhash = await Image.generateBlurhashAsync(compressedUri, [7, 5]);
    const end2 = performance.now();
    console.log('time to generate blurhash', end2 - start2);
    return blurhash;
}
