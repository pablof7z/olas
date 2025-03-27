import * as MediaLibrary from 'expo-media-library';
import { atom, useAtom, useSetAtom } from 'jotai';

import { albumPermission, albumsAtom } from './store';

export function useAlbums() {
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const setAlbumPermission = useSetAtom(albumPermission);
    const [albums, setAlbums] = useAtom(albumsAtom);

    async function getAlbums() {
        if (permissionResponse?.status !== 'granted') {
            await requestPermission();
        } else {
            setAlbumPermission(true);
        }
        const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
            includeSmartAlbums: true,
        });
        setAlbums(fetchedAlbums);
    }

    return { getAlbums, albums };
}
