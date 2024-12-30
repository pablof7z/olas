import { BlobDescriptor, BlossomClient, SignedEvent } from './blossom-client';
import { generateMediaEventFromBlobDescriptor, sign, signWith } from './blossom';
import { NDKSigner } from '@nostr-dev-kit/ndk-mobile';
import NDK from '@nostr-dev-kit/ndk-mobile';

export class Uploader {
    private fileUri: string;
    private _onProgress?: (progress: number) => void;
    private _onError?: (error: Error) => void;
    private _onUploaded?: (blob: BlobDescriptor) => void;
    public mime;
    private url: URL;
    private xhr: XMLHttpRequest;
    private response?: BlobDescriptor;
    public signer?: NDKSigner;
    private ndk: NDK;

    constructor(ndk: NDK, fileUri: string, mime: string, server: string) {
        this.ndk = ndk;
        this.fileUri = fileUri;
        this.mime = mime;
        this.url = new URL(server);
        this.url.pathname = '/media';

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

    private encodeAuthorizationHeader(uploadAuth: SignedEvent) {
        return 'Nostr ' + btoa(unescape(encodeURIComponent(JSON.stringify(uploadAuth))));
    }

    async start() {
        try {
            let _sign = signWith(this.signer ?? this.ndk.signer);
            const uploadAuth = await BlossomClient.getUploadAuth(this.fileUri, this.mime, _sign as any, 'Upload file');
            const encodedAuthHeader = this.encodeAuthorizationHeader(uploadAuth);

            this.xhr.open('PUT', this.url.toString(), true);
            this.xhr.setRequestHeader('Authorization', encodedAuthHeader);
            this.xhr.upload.addEventListener('progress', (e) => this.xhrOnProgress(e));
            this.xhr.addEventListener('load', (e) => this.xhrOnLoad(e));
            this.xhr.addEventListener('error', (e) => this.xhrOnError(e));

            if (this.mime) this.xhr.setRequestHeader('Content-Type', this.mime);

            // read file and send
            const file = await fetch(this.fileUri).then((r) => r.blob());
            this.xhr.send(file);

            return this.xhr;
        } catch (e) {
            console.trace('👉 error here', e);
            this.xhrOnError(e);
        }
    }

    private xhrOnProgress(e: ProgressEvent) {
        console.log('xhrOnProgress', { loaded: e.loaded, total: e.total });
        if (e.lengthComputable && this._onProgress) {
            this._onProgress((e.loaded / e.total) * 100);
        }
    }

    private xhrOnLoad(e: ProgressEvent) {
        const status = this.xhr.status;

        if (status < 200 || status >= 300) {
            if (this._onError) {
                console.log('upload error', this.xhr.responseText);
                this._onError(new Error(this.xhr.responseText ?? `Error ${status}`));
                return;
            } else {
                console.log('upload error', this.xhr);
                throw new Error(`Failed to upload file: ${status}`);
            }
        }

        try {
            this.response = JSON.parse(this.xhr.responseText);
        } catch (e) {
            throw new Error('Failed to parse response');
        }

        if (this._onUploaded && this.response) {
            this._onUploaded(this.response);
        }
    }

    private xhrOnError(e: ProgressEvent) {
        if (this._onError) {
            console.log('upload error', JSON.stringify(Object.keys(this.xhr)));
            console.log('upload error', this.xhr.responseText);
            console.log('upload error', this.xhr.status);
            this._onError(new Error(this.xhr.responseText ?? 'Failed to upload file'));
        }
    }

    destroy() {
        this.xhr.abort();
    }

    mediaEvent() {
        return generateMediaEventFromBlobDescriptor(this.ndk, this.response!);
    }
}
