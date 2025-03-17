import { useAtomValue, useAtom } from 'jotai';
import { ChevronDown, Images } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { albumsAtom, selectedAlbumAtom } from './store';
import { useColorScheme } from '@/lib/useColorScheme';
import { Button } from '../nativewindui/Button';
import { Text } from '../nativewindui/Text';

export default function AlbumSelectorHandler() {
    const albums = useAtomValue(albumsAtom);
    const [selectedAlbum, setSelectedAlbum] = useAtom(selectedAlbumAtom);
    const { colors } = useColorScheme();
    const albumBottomSheetRef = useAtomValue(albumBottomSheetRefAtom);
    const [multiImageMode, setMultiImageMode] = useAtom(multiImageModeAtom);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    useEffect(() => {
        if (selectedAlbum === null && albums && albums.length > 0) {
            setSelectedAlbum(albums[0]);
        }
    }, [albums]);

    function openAlbumsBottomSheet() {
        albumBottomSheetRef?.current?.present();
    }

    function toggleMultiImageMode() {
        if (multiImageMode && selectedMedia.length > 0) {
            setSelectedMedia([selectedMedia[0]]);
        }
        setMultiImageMode(!multiImageMode);
    }

    return (
        <View className="flex-row items-center justify-between border-y border-border bg-card p-2">
            <Button variant="secondary" size="sm" onPress={openAlbumsBottomSheet}>
                <Text>{selectedAlbum?.title}</Text>
                <ChevronDown color={colors.muted} />
            </Button>

            <Button variant={multiImageMode ? 'secondary' : 'plain'} size="sm" onPress={toggleMultiImageMode}>
                <Images size={24} color={colors.muted} />
            </Button>
        </View>
    );
}
