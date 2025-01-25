import NDK, { NDKEvent, NDKKind, NDKRelay, NDKRelaySet, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { PostMetadata } from './store';
import { MediaLibraryItem } from './MediaPreview';
import { encodeBase32 } from 'geohashing';

export async function generateEvent(ndk: NDK, metadata: PostMetadata, media: MediaLibraryItem[]) {
    if (media.length === 0) return;

    const event = new NDKEvent(ndk, {
        kind: getKind(metadata, media[0]),
        content: metadata.caption,
    } as NostrEvent);

    if (event.kind === NDKKind.Text) {
        let kind: NDKKind;

        if (media[0].mediaType === 'photo') kind = NDKKind.Image;
        else if (media[0].contentMode === 'portrait') kind = NDKKind.VerticalVideo;
        else kind = NDKKind.HorizontalVideo;

        event.content = [event.content, ...media.map((m) => m.uploadedUri)].join('\n');
        event.tags = [['k', kind.toString()]];
    }

    let relaySet: NDKRelaySet | undefined;
    
    if (metadata.group) {
        event.tags.push(['h', metadata.group.groupId, ...metadata.group.relays])
        relaySet = NDKRelaySet.fromRelayUrls(metadata.group.relays, ndk);
    }

    event.tags.push(...media.flatMap(generateImeta));

    if (event.kind !== NDKKind.Text) {
        event.alt = `This is a ${media[0].mediaType} published via Olas.\n` + media.map((m) => m.uploadedUri).join('\n');
    }

    if (metadata.expiration) event.tags.push(['expiration', Math.floor(metadata.expiration / 1000).toString()]);

    if (metadata.tags) {
        event.tags.push(...metadata.tags.map((tag) => ['t', tag]));
    }

    if (metadata.removeLocation === false && metadata.location) {
        for (let i = 1; i <= 6; i++) {
            const hash = encodeBase32(metadata.location.latitude, metadata.location.longitude, i);
            event.tags.push(['g', hash]);
        }
    }

    await event.sign();

    return {
        event,
        relaySet
    };
}

function getKind(metadata: PostMetadata, media: MediaLibraryItem) {
    // if (metadata.boost) return NDKKind.Text;

    if (media.mediaType === 'photo') return NDKKind.Image;

    if (media.contentMode === 'portrait') return NDKKind.VerticalVideo;

    return NDKKind.HorizontalVideo;
}

function generateImeta(media: MediaLibraryItem): NDKTag[] {
    const tags: NDKTag[] = [];
    const imetaTag: NDKTag = ['imeta'];

    imetaTag.push(['url', media.uploadedUri].join(' '));
    if (media.sha256 && media.uploadedSha256 !== media.sha256) {
        imetaTag.push(['ox', media.sha256].join(' '));
        imetaTag.push(['x', media.uploadedSha256].join(' '));
    } else if (media.sha256 || media.uploadedSha256) {
        const sha256 = media.sha256 || media.uploadedSha256;
        imetaTag.push(['x', sha256].join(' '));
    }
    if (media.width && media.height) imetaTag.push(['dim', `${media.width}x${media.height}`].join(' '));
    if (media.mimeType) imetaTag.push(['m', media.mimeType].join(' '));
    if (media.blurhash) imetaTag.push(['blurhash', media.blurhash].join(' '));
    if (media.size) imetaTag.push(['size', media.size.toString()].join(' '));

    tags.push(imetaTag);

    if (media.uploadedSha256) tags.push(['x', media.uploadedSha256]);
    if (media.mimeType) tags.push(['m', media.mimeType]);

    return tags;
}
