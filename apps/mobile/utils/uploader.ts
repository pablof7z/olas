import type NDK from '@nostr-dev-kit/ndk-mobile';
import type { NDKSigner } from '@nostr-dev-kit/ndk-mobile';

import { generateMediaEventFromBlobDescriptor, signWith } from './blossom';
import { type BlobDescriptor, BlossomClient, type SignedEvent } from './blossom-client';

export class Uploader {
    private fileUri: string;
    private _onProgress?: (progress: number) => void;
    private _onError?: (error: Error) => void;
    private _onUploaded?: (blob: BlobDescriptor) => void;
    public mime: string;
    private url: URL;
    private xhr: XMLHttpRequest;
    private response?: BlobDescriptor;
    public signer?: NDKSigner;
    private ndk: NDK;
    private sha256: string;

    constructor(ndk: NDK, fileUri: string, mime: string, server: string, sha256: string) {
        this.ndk = ndk;
        this.fileUri = fileUri;
        this.mime = mime;
        this.url = new URL(server);
        this.url.pathname = '/upload';
        this.sha256 = sha256;

        this.xhr = new XMLHttpRequest();
    }

    set onProgress(cb: (progress: number) => void) {
        this._onProgress = cb;
    }

    set onError(cb: (error: Error) => void) {
        this._onError = cb;
    }

    set onUploaded(cb: (blob: BlobDescriptor) => void) {
        this._onUploaded = cb;
    }

    private encodeAuthorizationHeader(uploadAuth: SignedEvent): string {
        return `Nostr ${btoa(unescape(encodeURIComponent(JSON.stringify(uploadAuth))))}`;
    }

    async start() {
        try {
            this.signer ??= this.ndk.signer;
            if (!this.signer) {
                throw new Error('No signer found');
            }
            const _sign = signWith(this.signer);
            const uploadAuth = await BlossomClient.getUploadAuth(
                _sign as any,
                'Upload file',
                this.sha256
            );
            const encodedAuthHeader = this.encodeAuthorizationHeader(uploadAuth);

            this.xhr.open('PUT', this.url.toString(), true);
            this.xhr.setRequestHeader('Authorization', encodedAuthHeader);
            if (this.mime) this.xhr.setRequestHeader('Content-Type', this.mime);

            // Attach progress event listener to xhr.upload
            this.xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && this._onProgress) {
                    const percentCompleted = Math.round((e.loaded / e.total) * 100);
                    this._onProgress(percentCompleted);
                } else if (!e.lengthComputable) {
                }
            });

            this.xhr.addEventListener('load', (e) => this.xhrOnLoad(e));
            this.xhr.addEventListener('error', (e) => this.xhrOnError(e));

            // Read file and send
            const file = await fetch(this.fileUri).then((r) => r.blob());
            this.xhr.send(file);

            return this.xhr;
        } catch (e) {
            console.trace('Error in start method:', e);
            this.xhrOnError(e as Event);
        }
    }

    private xhrOnLoad() {
        const status = this.xhr.status;
        if (status >= 200 && status < 300) {
            try {
                this.response = JSON.parse(this.xhr.responseText);
                if (this._onUploaded && this.response) {
                    this._onUploaded(this.response);
                }
            } catch (_parseError) {
                this._onError?.(new Error('Failed to parse server response'));
            }
        } else {
            this._onError?.(
                new Error(`Upload failed with status ${status}: ${this.xhr.responseText}`)
            );
        }
    }

    private xhrOnError(_e: Event) {
        this._onError?.(new Error(this.xhr.responseText || 'Failed to upload file'));
    }

    destroy() {
        this.xhr.abort();
    }

    mediaEvent() {
        if (!this.response) {
            throw new Error('No response available; upload may not have completed.');
        }
        return generateMediaEventFromBlobDescriptor(this.ndk, this.response);
    }
}
