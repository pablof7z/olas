import type { EventTemplate } from './blossom-client';
import type { BlobDescriptor } from './blossom-client';

const blossomUrlRegex = /\/[0-9a-f]{64}(\.\w+)?$/;

export function signWith(signer: any) {
    return (draft: EventTemplate) => sign(draft, signer);
}

export async function sign(draft: EventTemplate, signer?: any) {
    // Create a new NDK event using the provided signer's NDK instance
    const e = new signer.ndk.NDKEvent(signer.ndk, draft as any);
    await e.sign(signer);
    return e.toNostrEvent();
}

export function generateMediaEventFromBlobDescriptor(ndk: any, blob: BlobDescriptor) {
    const mediaEvent = new ndk.NDKEvent(ndk);
    mediaEvent.kind = 1063; // NDKKind.Media
    if (blob.type) mediaEvent.tags.push(['m', blob.type]);
    if (blob.sha256) mediaEvent.tags.push(['x', blob.sha256]);
    if (blob.url) mediaEvent.tags.push(['url', blob.url]);
    if (blob.size) mediaEvent.tags.push(['size', blob.size.toString()]);

    return mediaEvent;
}

// like https://cdn.hzrd149.com/2759c395ad643686baccdc3693b316ad968b7d95e5d9b764261532b44f42d29c.png
function isBlossomUrl(url: string) {
    return blossomUrlRegex.test(url);
}

function fileHashFromUrl(url: string) {
    // get the hash based on the regex
    const match = url.match(blossomUrlRegex);
    return match ? match[0].slice(1, 65) : null;
}

// Get appropriate Blossom server URL from environment or default
export function getBlossomServer(): string {
    // Default to blossom.nostr.com if no environment variable is set
    return import.meta.env.VITE_BLOSSOM_SERVER || 'https://blossom.nostr.com';
} 