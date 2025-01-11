import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useCallback, useEffect, useMemo } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { metadataAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, View } from 'react-native';
import { Camera as CameraIcon } from 'lucide-react-native';
import { Camera } from 'react-native-vision-camera';
import { useColorScheme } from '@/lib/useColorScheme';
import { Button } from '@/components/nativewindui/Button';
import { useAppSettingsStore } from '@/stores/app';
import { postTypeSelectorSheetRefAtom } from './store';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import Reel from '@/components/icons/reel';
import Polaroid from '@/components/icons/polaroid';
import { useNewPost } from '@/hooks/useNewPost';
import Photo from '@/components/icons/photo';
import { useAlbums } from '@/components/albums/hook';
import { AlbumContent } from '../AlbumsView';
import AlbumSelectorHandler from '@/components/albums/AlbumSelectorHandler';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export type PostType = {
    id: string;
    type: 'square-photo' | 'photo' | 'video';
    uri: string;
};

export default function PostTypeSelectorBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(postTypeSelectorSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const setAppSettingsPostType = useAppSettingsStore((state) => state.setPostType);


    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const { colors } = useColorScheme();

    const close = useCallback((cb: (event?: NDKEvent) => void) => {
        ref.current?.dismiss();
        cb();
    }, [ref]);

    const newPost = useNewPost();
    const insets = useSafeAreaInsets();

    return (
        <Sheet ref={ref}>
            <BottomSheetView style={{ width: '100%', flex: 1, alignContent: 'stretch', paddingBottom: insets.bottom }}>
                <View style={styles.container}>
                    <Button size="lg" variant="tonal" className="grow flex-row items-center gap-2" onPress={() => close(() => newPost({ types: ['images'], square: true }))}>
                        <Polaroid size={30} color={colors.foreground} />
                        <Text className="text-lg text-muted-foreground">1:1 Photo</Text>
                    </Button>

                    <Button size="lg" variant="secondary" className="grow flex-row items-center gap-2" onPress={() => close(() => newPost({ types: ['images'], square: false }))}>
                        <Photo size={48} color={colors.foreground} />
                        <Text className="text-lg text-muted-foreground">Uncropped Photo</Text>
                    </Button>

                        <Button size="lg" variant="secondary" className="grow flex-row items-center gap-2" onPress={() => close(() => newPost({ types: ['videos']}))}>
                            <Reel color={colors.foreground} />
                            <Text className="text-lg text-muted-foreground">Reel</Text>
                        </Button>
                </View>
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        margin: 10,
        gap: 10
    },
    row: {
        height: 120,
        flexDirection: 'row',
        gap: 10
    }
})