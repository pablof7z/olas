import { PostMedia } from './MediaPreview';
import NDK from '@nostr-dev-kit/ndk-mobile';
import { Uploader } from '@/utils/uploader';
import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
import { BlobDescriptor } from '@/utils';

export async function uploadMedia(
    media: PostMedia[],
    ndk: NDK,
    blossomServer: string = DEFAULT_BLOSSOM_SERVER
): Promise<PostMedia[]> {
    const mediaItems = [...media];

    for (const m of mediaItems) {
        await new Promise<void>((resolve, reject) => {
            const uploader = new Uploader(ndk, m.uri, m.mimeType, blossomServer, m.sha256);
            uploader.onUploaded = (data: BlobDescriptor) => {
                console.log('uploader.onUploaded', data);
                m.uploadedUri = data.url;
                m.uploadedSha256 = data.sha256;
                resolve();
            };
            uploader.onProgress = (progress) => {
                console.log('uploader.onProgress', progress);
            };
            uploader.onError = (error) => {
                reject(error);
            };
            uploader.start();
        });
    }

    return mediaItems;
}