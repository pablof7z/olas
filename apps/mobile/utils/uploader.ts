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
        console.log('UPLOADER set onProgress', !!cb);
        this._onProgress = cb;
    }

    set onError(cb: (error: Error) => void) {
        console.log('UPLOADER set onError', !!cb);
        this._onError = cb;
    }

    set onUploaded(cb: (blob: BlobDescriptor) => void) {
        console.log('UPLOADER set onUploaded', !!cb);
        this._onUploaded = cb;
    }

    private encodeAuthorizationHeader(uploadAuth: SignedEvent) {
        console.log('uploadAuth', JSON.stringify(uploadAuth, null, 4));
        return 'Nostr ' + btoa(unescape(encodeURIComponent(JSON.stringify(uploadAuth))));
    }

    async start() {
        try {
            this.signer ??= this.ndk.signer;
            if (!this.signer) {
                throw new Error('No signer found');
            }
            let _sign = signWith(this.signer);
            const uploadAuth = await BlossomClient.getUploadAuth(
                _sign as any,
                'Upload file',
                this.sha256
            );
            const encodedAuthHeader = this.encodeAuthorizationHeader(uploadAuth);

            this.xhr.open('PUT', this.url.toString(), true);
            this.xhr.setRequestHeader('Authorization', encodedAuthHeader);
            this.xhr.upload.addEventListener('progress', (e) => console.log('xhr.upload.onprogress event listener', e));
            this.xhr.upload.onprogress = (e) => console.log('xhr.upload.onprogress', e);
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
                console.log('upload error:', this.xhr.responseText, this.xhr.status, this.fileUri);
                this._onError(new Error(this.xhr.responseText ?? `Error ${status}`));
                return;
            } else {
                console.log('upload error:', this.xhr, this.xhr.responseText, this.xhr.status, this.fileUri);
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
        console.log('UPLOADER xhrOnError', e);
        if (this._onError) {
            console.log('upload error', JSON.stringify(Object.keys(this.xhr)));
            console.log('upload error', this.xhr.responseText);
            console.log('upload error', this.xhr.status);
            this._onError(new Error(this.xhr.responseText ?? 'Failed to upload file: '));
        }
    }

    destroy() {
        this.xhr.abort();
    }

    mediaEvent() {
        return generateMediaEventFromBlobDescriptor(this.ndk, this.response!);
    }
}
