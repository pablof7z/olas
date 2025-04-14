import { getThumbnailAsync } from 'expo-video-thumbnails';

export default async function thumbnail(uri: string): Promise<string> {
    if (!uri) throw new Error('Local URI is not set');

    const thumbnail = await getThumbnailAsync(uri);
    return thumbnail.uri;
}
