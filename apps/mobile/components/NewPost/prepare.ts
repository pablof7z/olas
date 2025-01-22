import { Blurhash } from 'react-native-blurhash';
import { MediaLibraryItem } from './MediaPreview';
import * as FileSystem from 'expo-file-system';
import { Location } from './store';
import { Image as CompressedImage } from 'react-native-compressor';
import * as Exify from '@lodev09/react-native-exify';
import { Image } from 'expo-image';
import { determineMimeType } from './AlbumsView';
import * as RNFS from 'react-native-fs';

export async function prepareMedia(media: MediaLibraryItem[]): Promise<MediaLibraryItem[]> {
    const res = [];

    for (const m of media) {
        const output = await prepareMediaItem(m);
        res.push(output);
    }

    return res;
}

export async function prepareMediaItem(media: MediaLibraryItem): Promise<MediaLibraryItem> {
    let { mimeType, blurhash, width, height } = media;

    if (!mimeType) mimeType = await determineMimeType(media.uri);

    let location: Location | undefined;
    let newUri: string;

    if (media.mediaType === 'photo') {
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        newUri = FileSystem.cacheDirectory + randomId + '.jpg';

        await FileSystem.copyAsync({ from: media.uri, to: newUri });

        const exif = await Exify.readAsync(newUri);
        const hasLocation = exif.GPSLatitude !== undefined && exif.GPSLongitude !== undefined;
        location = hasLocation ? { latitude: exif.GPSLatitude, longitude: exif.GPSLongitude } : undefined;

        const compressedUri = await CompressedImage.compress(newUri, {
            compressionMethod: 'auto',
            maxWidth: 2048,
            maxHeight: 1024,
            quality: 1.0,
            progressDivider: 10,
        });

        newUri = compressedUri;

        // read the image to find width and height
        const imageData = await Image.loadAsync(compressedUri);
        if (imageData?.height && imageData?.width) {
            height = imageData.height;
            width = imageData.width;
            console.log('setting image dimensions', height, width);
        }
        
        // zero-out the gps data
        await Exify.writeAsync(compressedUri, zeroedGpsData);
    } else {
        newUri = media.uri;
    }

    // getting sha256
    const sha256 = await RNFS.hash(newUri, 'sha256');

    if (!blurhash && media.mediaType === 'photo') {
        try {
            blurhash = await generateBlurhash(newUri);
        } catch (error) {
            console.error('Error generating blurhash', error);
        }
    }

    return {
        ...media,
        uri: newUri,
        sha256,
        blurhash,
        width,
        height,
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

    
    try {
        return await Blurhash.encode(compressedUri, 7, 5);
    } catch (error) {
        console.error('Error generating blurhash', error);
        return null;
    }
}