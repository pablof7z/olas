import { NDKEvent, type NDKTag } from '@nostr-dev-kit/ndk';

export interface ImetaData {
    url?: string;
    blurhash?: string;
    dim?: string;
    alt?: string;
    m?: string;
    x?: string;
    fallback?: string[];
}

export function imetasFromEvent(event: NDKEvent): ImetaData[] {
    const imetaData: ImetaData[] = [];

    if (!event.hasTag('imeta')) {
        const IMAGE_URL_REGEX = new RegExp(/https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|svg|webp)/g);
        const urlsInContent = event.content.match(IMAGE_URL_REGEX);
        if (urlsInContent) {
            for (const url of urlsInContent) {
                imetaData.push({ url });
            }
        }
    }

    for (const tag of event.getMatchingTags('imeta')) {
        const data = imetaFromTag(tag);
        if (data) {
            imetaData.push(data);
        }
    }

    return imetaData;
}

export function imetaFromTag(tag: NDKTag): ImetaData {
    const data: ImetaData = {};
    const fallbacks: string[] = [];

    // if we have a single value, split the string into key/value pairs
    if (tag.length === 2) {
        const parts = tag[1].split(' ');

        for (let i = 0; i < parts.length; i += 2) {
            const key = parts[i];
            const value = parts[i + 1];
            data[key] = value;
        }
    }

    // Split the string into pairs and process each pair
    for (const val of tag) {
        const parts = val.split(' ');
        const key = parts[0];
        const value = parts.slice(1).join(' ');

        if (key === 'fallback') {
            fallbacks.push(value);
        } else {
            data[key] = value;
        }
    }

    if (fallbacks.length > 0) {
        data.fallback = fallbacks;
    }

    return data;
}

export function imetaToTags(imeta: ImetaData): NDKTag[] {
    const val = Object.entries(imeta)
        .map(([key, value]) => `${key} ${value}`)
        .flat();
    const tags = [['imeta', ...val]];

    if (imeta.x) tags.push(['x', imeta.x]);

    return tags;
}
