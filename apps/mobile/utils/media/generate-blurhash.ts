import { Blurhash } from 'react-native-blurhash';
import {
    Image as CompressedImage,
    Video as CompressedVideo,
    getVideoMetaData,
} from 'react-native-compressor';

export default async function generateBlurhash(uri: string) {
    try {
        console.log('[BLURHASH] compressing', uri);
        const compressedUri = await CompressedImage.compress(uri, {
            compressionMethod: 'manual',
            maxWidth: 300,
            maxHeight: 300,
            quality: 0.5,
        });
        console.log('[BLURHASH] compressed', compressedUri);

        const bh = await Blurhash.encode(compressedUri, 7, 5);

        console.log('[BLURHASH] generated', bh);

        return bh;
    } catch (error) {
        console.error('Error generating blurhash', error);
        return null;
    }
}
