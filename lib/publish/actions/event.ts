import type NDK from '@nostr-dev-kit/ndk-mobile';
import {
    NDKEvent,
    NDKImage,
    type NDKImetaTag,
    NDKKind,
    NDKRelaySet,
    NDKVideo,
    imetaTagToTag,
} from '@nostr-dev-kit/ndk-mobile';
import { encodeBase32 } from 'geohashing';

import type { PostMedia, PostMetadata } from '../types';

function generateImageEvent(ndk: NDK, _metadata: PostMetadata, media: PostMedia[]): NDKImage {
    const event = new NDKImage(ndk);
    const imetas: NDKImetaTag[] = [];

    for (const m of media) {
        const imeta = mediaToImeta(m);
        imetas.push(imeta);
    }

    event.imetas = imetas;

    return event;
}

function mediaToImeta(media: PostMedia): NDKImetaTag {
    const imeta: NDKImetaTag = {};

    imeta.url = media.uploadedUri;
    imeta.image = media.uploadedThumbnailUri;
    imeta.x = media.uploadedSha256;
    if (media.uploadedSha256 !== media.localSha256 && media.localSha256)
        imeta.ox = media.localSha256;
    imeta.dim = `${media.width}x${media.height}`;
    imeta.m = media.mimeType;
    imeta.blurhash = media.blurhash;
    imeta.size = media.size?.toString?.();

    return imeta;
}

function generateVideoEvent(ndk: NDK, _metadata: PostMetadata, media: PostMedia[]): NDKVideo {
    const event = new NDKVideo(ndk);
    const imetas: NDKImetaTag[] = [];

    for (const m of media) {
        const imeta = mediaToImeta(m);
        imetas.push(imeta);
        event.duration ??= m.duration;
    }

    event.imetas = imetas;

    return event;
}

function generateTextEvent(ndk: NDK, metadata: PostMetadata, media: PostMedia[]): NDKEvent {
    const tagKind = media[0].mediaType === 'image' ? NDKKind.Image : NDKKind.ShortVideo;

    // For maximum reach, use kind:1 event
    const event = new NDKEvent(ndk, {
        kind: NDKKind.Text,
        content: metadata.caption,
        tags: [['k', tagKind.toString()]],
    });

    // Add media URLs to content
    event.content = [event.content, ...media.map((m) => m.uploadedUri)].join('\n');

    // Add imetas to the kind:1 event as tags
    for (const m of media) {
        const imeta = mediaToImeta(m);
        // Convert imeta object to a tag array using imetaTagToTag
        event.tags.push(imetaTagToTag(imeta));
    }

    return event;
}

export async function generateEvent(ndk: NDK, metadata: PostMetadata, media: PostMedia[]) {
    if (media.length === 0) return;

    let event: NDKImage | NDKVideo | NDKEvent;

    if (metadata.visibility === 'text-apps') {
        event = generateTextEvent(ndk, metadata, media);
    } else {
        // For followers, use the appropriate media-specific event type
        switch (media[0].mediaType) {
            case 'image':
                event = generateImageEvent(ndk, metadata, media);
                break;
            case 'video':
                event = generateVideoEvent(ndk, metadata, media);
                break;
        }
        event.content = metadata.caption;
    }

    let relaySet: NDKRelaySet | undefined;

    if (metadata.groups?.[0]?.relayUrls) {
        event.tags.push(['h', metadata.groups[0].groupId, ...metadata.groups[0].relayUrls]);
        relaySet = NDKRelaySet.fromRelayUrls(metadata.groups[0].relayUrls, ndk);
    }

    if (event.kind !== NDKKind.Text) {
        event.alt = `This is a ${media[0].mediaType} published via Olas.\n${media.map((m) => m.uploadedUri).join('\n')}`;
    }

    const now = Math.floor(new Date().getTime() / 1000);
    if (metadata.expiration)
        event.tags.push(['expiration', (metadata.expiration + now).toString()]);

    if (metadata.tags) {
        event.tags.push(...metadata.tags.map((tag) => ['t', tag]));
    }

    if (metadata.location) {
        for (let i = 1; i <= 6; i++) {
            const hash = encodeBase32(metadata.location.latitude, metadata.location.longitude, i);
            event.tags.push(['g', hash]);
        }
    }

    await event.sign();

    return {
        event,
        relaySet,
    };
}
