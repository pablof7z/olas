import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk';
import { Image } from 'expo-image';
import * as Crypto from 'expo-crypto';

export interface ImetaData {
    url?: string;
    blurhash?: string;
    dim?: string;
    alt?: string;
    m?: string;
    x?: string;
    fallback?: string[];
}

export function imetaFromEvent(event: NDKEvent): ImetaData {
    const imetaTag = event.tagValue('imeta');
    if (!imetaTag) return {};

    const data: ImetaData = {};
    const fallbacks: string[] = [];

    // Split the string into pairs and process each pair
    const pairs = imetaTag.match(/\S+\s+\S+/g) || [];
    for (const pair of pairs) {
        const [key, ...valueParts] = pair.split(' ');
        const value = valueParts.join(' ');

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

export async function imetaFromImage(fileContent: string, url?: string): Promise<ImetaData> {
    console.log('imetaFromImage', fileContent.length, url);
    const imeta: ImetaData = {};

    const base64Url = `data:image/jpeg;base64,${fileContent}`;

    try {
        console.log('generating blurhash');
        const blurhash = await Image.generateBlurhashAsync(base64Url, [4, 3]);
        if (blurhash) {
            imeta.blurhash = blurhash;
        }
        console.log('blurhash', blurhash);
    } catch (error) {
        console.error('Error generating blurhash', error);
    }

    const response = await fetch(base64Url);
    const mime = response.headers.get('content-type');
    if (mime) { imeta.m = mime; }
    if (url) { imeta.url = url; }

    // const buffer = await response.arrayBuffer();
    // const hashBuffer = await Crypto.digest(
    //     Crypto.CryptoDigestAlgorithm.SHA256,
    //     buffer
    // );
    // const sha256 = Array.from(new Uint8Array(hashBuffer))
    //     .map(b => b.toString(16).padStart(2, '0'))
    //     .join('');
    // imeta.x = sha256;
    // tags.push(["x", sha256]);

    console.log('imeta', JSON.stringify(imeta, null, 2));

    if (Object.keys(imeta).length > 0) {
        return imeta;
    }

    return null;
}

export function imetaToTag(imeta: ImetaData): NDKTag {
    const val = Object.entries(imeta)
        .map(([key, value]) => `${key} ${value}`)
        .flat()
        .join(' ');
    return ['imeta', val];
}
