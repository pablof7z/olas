import { Blurhash } from 'react-native-blurhash';
import {
    Image as CompressedImage,
    Video as CompressedVideo,
    getVideoMetaData,
} from 'react-native-compressor';

export default async function generateBlurhash(uri: string) {
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
