import { Blurhash } from 'react-native-blurhash';
import {
    Image as CompressedImage,
    Video as CompressedVideo,
    getVideoMetaData,
} from 'react-native-compressor';

export default async function generateBlurhash(uri: string) {
    try {
        const compressedUri = await CompressedImage.compress(uri, {
            compressionMethod: 'manual',
            maxWidth: 300,
            maxHeight: 300,
            quality: 0.5,
        });

        const bh = await Blurhash.encode(compressedUri, 7, 5);

        return bh;
    } catch (error) {
        console.error('Error generating blurhash', error);
        return null;
    }
}
