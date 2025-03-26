import * as Exify from '@lodev09/react-native-exify';
import { Location } from "@/lib/publish/types";

export default async function removeExif(file: string, mediaType: 'image' | 'video'): Promise<Location | null> {
    let location: Location | null = null;

    if (mediaType === 'image') {
        const exif = await Exify.readAsync(file);
        const hasLocation = exif?.GPSLatitude !== undefined && exif?.GPSLongitude !== undefined;
        if (hasLocation) {
            location = { latitude: exif.GPSLatitude!, longitude: exif.GPSLongitude! };
            await Exify.writeAsync(file, zeroedGpsData);
        }
    } else if (mediaType === 'video') {
        console.log('no exif to clean on video', file);
    } else {
        throw new Error('Invalid media type: ' + mediaType);
    }

    return location;
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
