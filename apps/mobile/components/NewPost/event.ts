import NDK, { NDKEvent, NDKKind, NDKTag, NostrEvent } from "@nostr-dev-kit/ndk-mobile";
import { PostMetadata, PostType } from "./store";
import { MediaLibraryItem } from "./MediaPreview";
import { encodeBase32, decodeBase32 } from 'geohashing';

export async function generateEvent(
    ndk: NDK,
    metadata: PostMetadata,
    media: MediaLibraryItem[]
) {
    if (media.length === 0) return;

    const event = new NDKEvent(ndk, {
        kind: getKind(metadata.type, media[0]),
        content: metadata.caption,
    } as NostrEvent);

    if (event.kind === NDKKind.Text) {
        let kind: NDKKind;

        if (media[0].mediaType === 'photo') kind = NDKKind.Image;
        else if (media[0].contentMode === 'portrait') kind = NDKKind.VerticalVideo;
        else kind = NDKKind.HorizontalVideo;

        event.tags = [["k", kind.toString()]];
    }

    event.tags = media.flatMap(generateImeta);
    event.alt = `This is a ${media[0].mediaType} published via Olas.\n` + media.map(m => m.uploadedUri).join('\n');

    if (metadata.expiration) event.tags.push(["expiration", Math.floor(metadata.expiration / 1000).toString()]);

    console.log('removeLocation', metadata.removeLocation);
    console.log('location', metadata.location);
    
    if (metadata.removeLocation === false && metadata.location) {
        for (let i = 1; i <= 6; i++) {
            const hash = encodeBase32(metadata.location.latitude, metadata.location.longitude, i);
            event.tags.push(["g", hash]);
        }
    }

    await event.sign();
    console.log('event', JSON.stringify(event.rawEvent(), null, 4));
    
    return event;
}

function getKind(type: PostType, media: MediaLibraryItem) {
    if (type === 'generic') return NDKKind.Text;
    if (media.mediaType === 'photo') return NDKKind.Image;

    if (media.contentMode === 'portrait') return NDKKind.VerticalVideo;

    return NDKKind.HorizontalVideo;
}

function generateImeta(media: MediaLibraryItem): NDKTag[] {
    const tags: NDKTag[] = [];
    const imetaTag: NDKTag = [ "imeta" ];

    imetaTag.push(["url", media.uploadedUri].join(' '))
    imetaTag.push(["ox", media.sha256].join(' '))
    if (media.uploadedSha256) imetaTag.push(["x", media.uploadedSha256].join(' '))
    if (media.width && media.height) imetaTag.push(["dim", `${media.width}x${media.height}`].join(' '))
    if (media.mimeType) imetaTag.push(["m", media.mimeType].join(' '))
    if (media.blurhash) imetaTag.push(["blurhash", media.blurhash].join(' '))
    
    tags.push(imetaTag);

    if (media.uploadedSha256) tags.push(["x", media.uploadedSha256]);
    if (media.mimeType) tags.push(["m", media.mimeType]);
        
    return tags;
}