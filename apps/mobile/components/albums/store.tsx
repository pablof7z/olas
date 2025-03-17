import * as MediaLibrary from 'expo-media-library';
import { atom } from 'jotai';

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
