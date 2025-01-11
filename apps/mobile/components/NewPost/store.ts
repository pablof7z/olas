import { atom } from 'jotai';
import { MediaLibraryItem } from './MediaPreview';

export type PostType = 'generic' | 'high-quality';

export const stepAtom = atom(0);

/**
 * Selected media
 */
export const selectedMediaAtom = atom<MediaLibraryItem[], [MediaLibraryItem[]], void>([], (get, set, media: MediaLibraryItem[]) =>
    set(selectedMediaAtom, media)
);

export type Location = {
    latitude: number;
    longitude: number;
};

export type PostMetadata = {
    caption: string;
    expiration?: number;
    type?: PostType;
    removeLocation?: boolean;
    location?: Location;
};
export const metadataAtom = atom<PostMetadata, [PostMetadata], void>({ caption: '' }, (get, set, metadata: PostMetadata) =>
    set(metadataAtom, metadata)
);

export const multiImageModeAtom = atom(false);

export const uploadingAtom = atom(false);
