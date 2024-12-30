import { atom } from 'jotai';
import * as MediaLibrary from 'expo-media-library';
import { MediaLibraryItem } from './MediaPreview';

export type PostType = 'generic' | 'high-quality';

export const stepAtom = atom(0);

/**
 * Album permission
 */
export const albumPermission = atom(false);

/**
 * Loaded albums
 */
export const albumsAtom = atom<MediaLibrary.Album[] | null, [MediaLibrary.Album[] | null], void>(
    null,
    (get, set, albums: MediaLibrary.Album[] | null) => set(albumsAtom, albums)
);

/**
 * Selected album
 */
export const selectedAlbumAtom = atom<MediaLibrary.Album | null, [MediaLibrary.Album | null], void>(
    null,
    (get, set, album: MediaLibrary.Album | null) => set(selectedAlbumAtom, album)
);

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
