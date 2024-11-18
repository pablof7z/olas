import { BlobDescriptor, BlossomClient, SignedEvent } from './blossom-client';
import { generateMediaEventFromBlobDescriptor, sign, signWith } from './blossom';
import { NDKSigner } from '@nostr-dev-kit/ndk';
import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';

export class Uploader {
    private blob: Blob;
    private server: string;
    private _onProgress?: (progress: number) => void;
    private _onError?: (error: Error) => void;
    private _onUploaded?: (url: string) => void;
    public mime;
    private url: URL;
    private xhr: XMLHttpRequest;
    private response?: BlobDescriptor;
    public signer?: NDKSigner;
    private ndk: NDK;

    constructor(ndk: NDK, blob: Blob, server: string) {
        this.ndk = ndk;
        this.blob = blob;
        this.server = server;
        this.mime = blob.type;
        this.url = new URL(server);
        this.url.pathname = '/upload';

        this.xhr = new XMLHttpRequest();
    }

    set onProgress(cb: (progress: number) => void) {
        this._onProgress = cb;
    }

    set onError(cb: (error: Error) => void) {
        this._onError = cb;
    }

    set onUploaded(cb: (url: string) => void) {
        this._onUploaded = cb;
    }

    private encodeAuthorizationHeader(uploadAuth: SignedEvent) {
        return 'Nostr ' + btoa(unescape(encodeURIComponent(JSON.stringify(uploadAuth))));
    }

    async start() {
        try {
            console.log('calling start', !!this.ndk);
            let _sign = signWith(this.signer ?? this.ndk.signer);
            const uploadAuth = await BlossomClient.getUploadAuth(this.blob as Blob, _sign as any, 'Upload file');
            const encodedAuthHeader = this.encodeAuthorizationHeader(uploadAuth);

            this.xhr.open('PUT', this.url.toString(), true);
            this.xhr.setRequestHeader('Authorization', encodedAuthHeader);
            this.xhr.upload.addEventListener('progress', (e) => this.xhrOnProgress(e));
            this.xhr.addEventListener('load', (e) => this.xhrOnLoad(e));
            this.xhr.addEventListener('error', (e) => this.xhrOnError(e));

            if (this.mime) this.xhr.setRequestHeader('Content-Type', this.mime);

            this.xhr.send(this.blob);

            return this.xhr;
        } catch (e) {
            console.trace('👉 error here', e);
            this.xhrOnError(e);
        }
    }

    private xhrOnProgress(e: ProgressEvent) {
        if (e.lengthComputable && this._onProgress) {
            this._onProgress((e.loaded / e.total) * 100);
        }
    }

    private xhrOnLoad(e: ProgressEvent) {
        const status = this.xhr.status;

        if (status < 200 || status >= 300) {
            if (this._onError) {
                this._onError(new Error(`Failed to upload file: ${status}`));
                return;
            } else {
                throw new Error(`Failed to upload file: ${status}`);
            }
        }

        try {
            this.response = JSON.parse(this.xhr.responseText);
        } catch (e) {
            throw new Error('Failed to parse response');
        }

        if (this._onUploaded && this.response) {
            this._onUploaded(this.response.url);
        }
    }

    private xhrOnError(e: ProgressEvent) {
        if (this._onError) {
            this._onError(new Error('Failed to upload file'));
        }
    }

    destroy() {
        this.xhr.abort();
    }

    mediaEvent() {
        return generateMediaEventFromBlobDescriptor(this.ndk, this.response!);
    }
}
