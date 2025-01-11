import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';

export interface ImetaData {
    url?: string;
    blurhash?: string;
    dim?: string;
    alt?: string;
    m?: string;
    x?: string;
    fallback?: string[];
    type?: 'video' | 'image';
}

// export function imetaToTags(imeta: ImetaData): NDKTag[] {
//     const val = Object.entries(imeta)
//         .map(([key, value]) => `${key} ${value}`)
//         .flat();
//     const tags = [['imeta', ...val]];

//     if (imeta.x) tags.push(['x', imeta.x]);

//     return tags;
// }
