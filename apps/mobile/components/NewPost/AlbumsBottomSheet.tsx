import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { selectedMediaAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Pressable, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

import { PostMedia, MediaPreview } from './MediaPreview';
import { ArrowRight } from 'lucide-react-native';
import { MasonryFlashList } from '@shopify/flash-list';
import AlbumsGrid from '../albums/grid';
import { albumsAtom, selectedAlbumAtom } from '../albums/store';

type AlbumBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;
export const albumBottomSheetRefAtom = atom<AlbumBottomSheetRefAtomType, [AlbumBottomSheetRefAtomType], null>(null, (get, set, value) =>
    set(albumBottomSheetRefAtom, value)
);

export function AlbumsBottomSheet() {
    const albums = useAtomValue(albumsAtom);
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(albumBottomSheetRefAtom);
    const inset = useSafeAreaInsets();

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const setSelectedAlbum = useSetAtom(selectedAlbumAtom);
    const setSelectedMedia = useSetAtom(selectedMediaAtom);
    const albumBottomSheetRef = useAtomValue(albumBottomSheetRefAtom);

    const onAlbumPress = useCallback(
        (album: MediaLibrary.Album) => {
            setSelectedAlbum(album);
            albumBottomSheetRef?.current?.dismiss();
        },
        [setSelectedAlbum, albumBottomSheetRef, setSelectedMedia]
    );

    return (
        <Sheet ref={ref} snapPoints={['80%']} maxDynamicContentSize={Dimensions.get('window').height * 0.7}>
            <BottomSheetView
                style={{
                    flexDirection: 'column',
                    width: '100%',
                    paddingBottom: inset.bottom,
                    minHeight: Dimensions.get('window').height * 0.6,
                }}>
                <Text variant="title1" className="text-grow">
                    Albums
                </Text>

                <AlbumsGrid albums={albums} onAlbumPress={onAlbumPress} />
            </BottomSheetView>
        </Sheet>
    );
}
