import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { albumsAtom, multiImageModeAtom, selectedAlbumAtom } from './store';
import { MediaLibraryItem } from './MediaPreview';
import { Dimensions, Pressable, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { selectedMediaAtom } from './store';
import { MediaPreview } from './MediaPreview';
import { MasonryFlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '@/components/nativewindui/Text';
import { Check, ChevronDown, Images } from 'lucide-react-native';
import { Button } from '../nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';
import { albumBottomSheetRefAtom } from './AlbumsBottomSheet';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

export default function AlbumsView() {
    return (
        <View className="flex-1 grow flex-col">
            <View className="h-1/2 w-full flex-col bg-muted-200">
                <SelectedMediaPreview />
            </View>

            <View className="h-1/2 flex-col justify-between">
                <AlbumList />
                <AlbumContent />
            </View>
        </View>
    );
}

function AlbumList() {
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

export async function determineMimeType(uri: string) {
    // read the file and get the mime type
    const fileContent = await fetch(uri).then((response) => response.blob());
    const mimeType = fileContent.type;
    console.log('mimeType', mimeType);

    return mimeType;
}

export function mapAssetToMediaLibraryItem(asset: MediaLibrary.Asset): MediaLibraryItem {
    let mediaType: 'photo' | 'video' = 'photo';
    if (asset.mediaType === 'video') mediaType = 'video';
    else if (asset.mediaType === 'photo') mediaType = 'photo';

    if (!mediaType) {
        mediaType = 'photo';
    }

    return {
        id: asset.id ?? asset.uri,
        uri: asset.uri,
        mediaType,
        contentMode: isPortrait(asset.width, asset.height) ? 'portrait' : 'landscape',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
    };
}

export function isPortrait(width: number, height: number) {
    return width < height;
}

function AlbumContent() {
    const selectedAlbum = useAtomValue(selectedAlbumAtom);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const [currentAlbumAssets, setCurrentAlbumAssets] = useState<MediaLibraryItem[]>([]);
    const endCursor = useRef<Record<string, string | false>>({});
    const albumAssets = useRef<Record<string, MediaLibraryItem[]>>({});

    console.log('assets', Object.keys(albumAssets.current));

    const getAlbumAssets = useCallback(async () => {
        try {
            if (selectedAlbum === null) return;

            // nothing more to load
            if (endCursor.current[selectedAlbum.id] === false) return;

            const albumId = selectedAlbum.id;

            console.log('loading more assets with cursor', endCursor.current[albumId]);

            const albumLoadedPage = await MediaLibrary.getAssetsAsync({
                album: selectedAlbum,
                first: 20,
                mediaType: ['photo', 'video'],
                after: endCursor.current[albumId] ? endCursor.current[albumId] : undefined,
            });

            albumAssets.current[albumId] ??= [];

            for (const asset of albumLoadedPage.assets) {
                const index = albumAssets.current[albumId].findIndex((a) => a.id === asset.id);
                if (index !== -1) {
                    console.log('asset was already loaded in index', index);
                    continue;
                }
                albumAssets.current[albumId].push(mapAssetToMediaLibraryItem(asset));
            }

            setCurrentAlbumAssets([...albumAssets.current[albumId]]);
            console.log('setting current album assets', albumAssets.current[albumId].length);

            console.log(
                'received',
                albumLoadedPage.assets.length,
                'assets',
                'making the current album loaded assets',
                albumAssets.current[albumId].length
            );

            endCursor.current[albumId] = albumLoadedPage.hasNextPage ? albumLoadedPage.endCursor : false;

            if (selectedMedia.length === 0 && albumLoadedPage.assets.length > 0) {
                setSelectedMedia([mapAssetToMediaLibraryItem(albumLoadedPage.assets[0])]);
            }
        } catch (error) {
            console.error('error getting album assets', error);
        }
    }, [selectedAlbum, selectedAlbum?.id]);

    useEffect(() => {
        getAlbumAssets();
    }, [getAlbumAssets]);

    const size = Dimensions.get('screen').width / 3;

    const style = useCallback(
        (index: number) => ({
            marginHorizontal: index % 3 === 1 ? 1 : 0,
            marginBottom: 1,
            overflow: 'hidden',
            width: size,
            height: size,
        }),
        [size]
    );

    const setImage = (item: MediaLibraryItem, selectedMedia: MediaLibraryItem[], mode: boolean) => {
        if (mode) {
            const index = selectedMedia.findIndex((media) => media.uri === item.uri);
            const selectedMediaCopy = [...selectedMedia];
            if (index !== -1) selectedMediaCopy.splice(index, 1);
            else selectedMediaCopy.push(item);
            setSelectedMedia(selectedMediaCopy);
        } else {
            setSelectedMedia([item]);
        }
    };

    function loadMore() {
        if (endCursor.current) getAlbumAssets();
    }

    console.log('currentAlbumAssets length', currentAlbumAssets.length);

    return (
        <View className="flex-1">
            <Text className="fixed -top-1/2 left-0 z-50 bg-red-500 p-4">Assets: {currentAlbumAssets.length}</Text>
            <MasonryFlashList
                data={currentAlbumAssets}
                numColumns={3}
                estimatedItemSize={size}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <GridItem item={item} index={index} setImage={setImage} style={style(index)} />}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    loadMore();
                }}
            />
        </View>
    );
}

function GridItem({
    item,
    index,
    setImage,
    style,
}: {
    item: MediaLibraryItem;
    index: number;
    setImage: (item: MediaLibraryItem, selectedMedia: MediaLibraryItem[], mode: boolean) => void;
    style: any;
}) {
    const multiImageMode = useAtomValue(multiImageModeAtom);
    const selectedMedia = useAtomValue(selectedMediaAtom);
    const isSelected = multiImageMode && selectedMedia.some((media) => media.uri === item.uri);
    const { colors } = useColorScheme();

    // Reanimated fade-in animation
    const opacity = useSharedValue(0); // Start at 0 opacity

    // Trigger animation on mount
    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 }); // Animate to 1 over 300ms
    }, []);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Pressable onPress={() => setImage(item, selectedMedia, multiImageMode)} className="relative">
            <Animated.View // Wrap in Animated.View
                style={[style, animatedStyle]} // Combine style and animation
            >
                {isSelected && (
                    <Button
                        className="bg-foreground/50 border-border/50 absolute right-2 top-2 z-10 h-8 w-8 !rounded-full border"
                        variant="secondary"
                        onPress={() => setImage(item, selectedMedia, multiImageMode)}>
                        <Check size={24} color={colors.background} />
                    </Button>
                )}
                <MediaPreview assets={[item]} style={style} />
            </Animated.View>
        </Pressable>
    );
}

export function SelectedMediaPreview() {
    const selectedMedia = useAtomValue(selectedMediaAtom);

    const size = Dimensions.get('screen').width;

    console.log('selectedMedia', selectedMedia.length);

    return (
        <View className="flex-1 flex-col items-center justify-between">
            <MediaPreview assets={selectedMedia} style={{ width: size, height: size }} />
        </View>
    );
}
