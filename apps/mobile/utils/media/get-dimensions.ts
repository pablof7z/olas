import { Image } from 'expo-image';

import { convertMediaPath } from '.';

export default async function getDimensions(
    uri: string
): Promise<{ width: number; height: number }> {
    const normalizedUri = await convertMediaPath(uri, 'image');
    const imageData = await Image.loadAsync(normalizedUri);
    return {
        width: imageData.width,
        height: imageData.height,
    };
}
