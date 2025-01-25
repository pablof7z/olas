import { atom } from 'jotai';
import { MediaLibraryItem } from './MediaPreview';
import { GroupEntry } from '@/app/communities';

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
    tags?: string[];
    expiration?: number;
    boost?: boolean;
    removeLocation?: boolean;
    location?: Location;
    group?: {
        groupId: string;
        relays: string[];
    }
};
export const metadataAtom = atom<PostMetadata, [PostMetadata], void>({ caption: '' }, (get, set, metadata: PostMetadata) =>
    set(metadataAtom, metadata)
);

export const multiImageModeAtom = atom(false);

export const uploadingAtom = atom(false);
