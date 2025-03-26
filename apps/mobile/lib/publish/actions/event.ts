import NDK, {
    NDKImage,
    NDKImetaTag,
    NDKKind,
    NDKRelaySet, NDKVideo
} from '@nostr-dev-kit/ndk-mobile';
import { encodeBase32 } from 'geohashing';
import { PostMedia, PostMetadata } from '../types';

function generateImageEvent(ndk: NDK, metadata: PostMetadata, media: PostMedia[]): NDKImage {
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
    if (media.uploadedSha256 !== media.localSha256 && media.localSha256) imeta.ox = media.localSha256;
    imeta.dim = `${media.width}x${media.height}`;
    imeta.m = media.mimeType;
    imeta.size = media.size?.toString?.();

    console.log('translated media to imeta', { imeta: JSON.stringify(imeta, null, 4), media: JSON.stringify(media, null, 4) });

    return imeta;
}

function generateVideoEvent(ndk: NDK, metadata: PostMetadata, media: PostMedia[]): NDKVideo {
    const event = new NDKVideo(ndk);
    const imetas: NDKImetaTag[] = [];

    for (const m of media) {
        const imeta = mediaToImeta(m);
        imetas.push(imeta);
        event.duration ??= m.duration;
        console.log('setting duration to', m.duration);
    }

    event.imetas = imetas;

    return event;
}

export async function generateEvent(ndk: NDK, metadata: PostMetadata, media: PostMedia[]) {
    if (media.length === 0) return;

    let event: NDKImage | NDKVideo;

    switch (media[0].mediaType) {
        case 'image':
            event = generateImageEvent(ndk, metadata, media);
            break;
        case 'video':
            event = generateVideoEvent(ndk, metadata, media);
            break;
    }

    event.content = metadata.caption;

    // if (event.kind === NDKKind.Text) {
    //     let kind: NDKKind;

    //     if (media[0].mediaType === 'image') kind = NDKKind.Image;
    //     else if (media[0].contentMode === 'portrait') kind = NDKKind.VerticalVideo;
    //     else kind = NDKKind.HorizontalVideo;

    //     event.content = [event.content, ...media.map((m) => m.uploadedUri)].join('\n');
    //     event.tags = [['k', kind.toString()]];
    // }

    let relaySet: NDKRelaySet | undefined;

    if (metadata.groups?.[0]?.relayUrls) {
        event.tags.push(['h', metadata.groups[0].groupId, ...metadata.groups[0].relayUrls]);
        relaySet = NDKRelaySet.fromRelayUrls(metadata.groups[0].relayUrls, ndk);
    }

    if (event.kind !== NDKKind.Text) {
        event.alt = `This is a ${media[0].mediaType} published via Olas.\n` + media.map((m) => m.uploadedUri).join('\n');
    }

    const now = Math.floor(new Date().getTime() / 1000);
    if (metadata.expiration) event.tags.push(['expiration', (metadata.expiration + now).toString()]);

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

    console.log('signed media event', JSON.stringify(event.rawEvent(), null, 4));

    return {
        event,
        relaySet,
    };
}

function getKind(metadata: PostMetadata, media: PostMedia) {
    // if (metadata.boost) return NDKKind.Text;

    if (media.mediaType === 'image') return NDKKind.Image;

    if (media.contentMode === 'portrait') return NDKKind.VerticalVideo;

    return NDKKind.HorizontalVideo;
}
