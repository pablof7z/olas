import { BlossomClient } from './blossom-client';
import type { BlobDescriptor, SignedEvent } from './blossom-client';
import { calculateSHA256 } from './sha256';

// Utility to create media event similar to mobile app function
export function generateMediaEventFromBlobDescriptor(ndk: any, blob: BlobDescriptor) {
    const mediaEvent = new ndk.NDKEvent();
    mediaEvent.kind = 1063; // NDKKind.Media
    if (blob.type) mediaEvent.tags.push(['m', blob.type]);
    if (blob.sha256) mediaEvent.tags.push(['x', blob.sha256]);
    if (blob.url) mediaEvent.tags.push(['url', blob.url]);
    if (blob.size) mediaEvent.tags.push(['size', blob.size.toString()]);

    return mediaEvent;
}

export class Uploader {
    private file: File;
    private _onProgress?: (progress: number) => void;
    private _onError?: (error: Error) => void;
    private _onUploaded?: (blob: BlobDescriptor) => void;
    public mime: string;
    private url: URL;
    private xhr: XMLHttpRequest;
    private response?: BlobDescriptor;
    public signer?: any;
    private ndk: any;
    private sha256: string;

    constructor(ndk: any, file: File, sha256: string, server: string) {
        this.ndk = ndk;
        this.file = file;
        this.mime = file.type;
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
        return 'Nostr ' + btoa(JSON.stringify(uploadAuth));
    }

    async start() {
        try {
            this.signer ??= this.ndk.signer;
            if (!this.signer) {
                throw new Error('No signer found');
            }
            
            // Create a sign function that uses the NDK signer
            const _sign = (draft: any) => {
                const e = new this.ndk.NDKEvent(this.ndk, draft);
                return e.sign(this.signer).then(() => e.toNostrEvent());
            };
            
            const uploadAuth = await BlossomClient.getUploadAuth(
                _sign,
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
                }
            });

            this.xhr.addEventListener('load', (e) => this.xhrOnLoad(e));
            this.xhr.addEventListener('error', (e) => this.xhrOnError(e));

            // Send the file directly
            this.xhr.send(this.file);

            return this.xhr;
        } catch (e) {
            console.error('Error in uploader start method:', e);
            this.xhrOnError(e as Event);
        }
    }

    private xhrOnLoad(e: Event) {
        const status = this.xhr.status;
        if (status >= 200 && status < 300) {
            try {
                this.response = JSON.parse(this.xhr.responseText);
                if (this._onUploaded && this.response) {
                    this._onUploaded(this.response);
                }
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                this._onError?.(new Error('Failed to parse server response'));
            }
        } else {
            console.error('Upload failed with status:', status, this.xhr.responseText);
            this._onError?.(new Error(`Upload failed with status ${status}: ${this.xhr.responseText}`));
        }
    }

    private xhrOnError(e: Event) {
        console.error('UPLOADER xhrOnError:', e);
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

// Helper function to create an uploader from a File
export async function createUploader(ndk: any, file: File, server: string): Promise<Uploader> {
    const sha256 = await calculateSHA256(file);
    return new Uploader(ndk, file, sha256, server);
} 