import type NDK from '@nostr-dev-kit/ndk-mobile';

import type { PostMedia } from '../types';

import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
import type { BlobDescriptor } from '@/utils';
import { Uploader } from '@/utils/uploader';
import { determineMimeType } from '@/utils/url';

export async function uploadMedia(
    media: PostMedia[],
    ndk: NDK,
    blossomServer: string = DEFAULT_BLOSSOM_SERVER
): Promise<PostMedia[]> {
    const mediaItems = [...media];

    for (const m of mediaItems) {
        if (m.localThumbnailUri) {
            if (!m.localThumbnailSha256) throw new Error('Local thumbnail sha256 is not set');

            const mimeType = await determineMimeType(m.localThumbnailUri);
            const { url, sha256 } = await upload(
                m.localThumbnailUri,
                ndk,
                blossomServer,
                mimeType,
                m.localThumbnailSha256
            );
            m.uploadedThumbnailUri = url;
        }

        if (m.localUri) {
            if (!m.localSha256) throw new Error('Local sha256 is not set');

            const mimeType = await determineMimeType(m.localUri);
            const { url, sha256 } = await upload(
                m.localUri,
                ndk,
                blossomServer,
                mimeType,
                m.localSha256
            );
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
            resolve({ url: data.url, sha256: data.sha256 });
        };
        uploader.onProgress = (_progress) => {};
        uploader.onError = (error) => {
            reject(error);
        };
        uploader.start();
    });
}
