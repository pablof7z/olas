import { PostMedia } from '../types';
import NDK from '@nostr-dev-kit/ndk-mobile';
import { Uploader } from '@/utils/uploader';
import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
import { BlobDescriptor } from '@/utils';
import { determineMimeType } from '@/utils/url';

export async function uploadMedia(media: PostMedia[], ndk: NDK, blossomServer: string = DEFAULT_BLOSSOM_SERVER): Promise<PostMedia[]> {
    const mediaItems = [...media];

    for (const m of mediaItems) {
        if (m.localThumbnailUri) {
            console.log('uploading thumbnail', m.localThumbnailUri);
            if (!m.localThumbnailSha256) throw new Error('Local thumbnail sha256 is not set');

            const mimeType = await determineMimeType(m.localThumbnailUri);
            const { url, sha256 } = await upload(m.localThumbnailUri, ndk, blossomServer, mimeType, m.localThumbnailSha256);
            m.uploadedThumbnailUri = url;
        }

        if (m.localUri) {
            console.log('uploading media', m.localUri);
            if (!m.localSha256) throw new Error('Local sha256 is not set');

            const mimeType = await determineMimeType(m.localUri);
            const { url, sha256 } = await upload(m.localUri, ndk, blossomServer, mimeType, m.localSha256);
            m.uploadedUri = url;
            m.uploadedSha256 = sha256;
        }
    }

    return mediaItems;
}

async function upload(
    localUri: string,
    ndk: NDK,
    blossomServer: string,
    mimeType: string,
    sha256: string
): Promise<{ url: string; sha256: string }> {
    return new Promise((resolve, reject) => {
        const uploader = new Uploader(ndk, localUri, mimeType, blossomServer, sha256);
        uploader.onUploaded = (data: BlobDescriptor) => {
            console.log('uploader.onUploaded', data);
            resolve({ url: data.url, sha256: data.sha256 });
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
