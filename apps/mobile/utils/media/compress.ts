import { Dimensions } from 'react-native';
import {
    Image as CompressedImage,
    Video as CompressedVideo,
    getVideoMetaData,
} from 'react-native-compressor';
import * as RNFS from 'react-native-fs';

import { determineMimeType } from '../url';
import type { ProgressCb } from './prepare';

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 1024;

type Result = {
    compressedUri: string;
    duration?: number;
    size?: number;
    mimeType?: string;
};

/**
 * Compresses images and videos
 */
export default async function compress(
    file: string,
    mediaType: 'image' | 'video',
    onProgress?: ProgressCb
): Promise<Result> {
    let compressedUri: string;
    let duration: number | undefined;
    let _width: number | undefined;
    let _height: number | undefined;

    if (mediaType === 'image') {
        compressedUri = await CompressedImage.compress(file, {
            compressionMethod: 'auto',
            maxWidth: MAX_WIDTH,
            maxHeight: MAX_HEIGHT,
            quality: 1.0,
            progressDivider: 10,
        });
    } else if (mediaType === 'video') {
        const metadata = await getVideoMetaData(file);

        duration = metadata.duration;

        const screenDimensions = Dimensions.get('screen');
        const maxWidth = Math.max(screenDimensions.width * 2, metadata.width);
        const maxHeight = Math.max(screenDimensions.height * 2, metadata.height);
        const maxSize = Math.max(maxWidth, maxHeight);

        compressedUri = await CompressedVideo.compress(
            file,
            {
                compressionMethod: 'manual',
                maxSize,
                progressDivider: 10,
            },
            (progress) => {
                onProgress?.('Compressing', progress);
            }
        );
    } else {
        throw new Error(`Invalid media type: ${mediaType}`);
    }

    const mimeType = await determineMimeType(compressedUri);
    const size = await RNFS.stat(compressedUri).then((stats) => stats.size);

    return {
        compressedUri,
        duration,
        mimeType,
        size,
    };
}
