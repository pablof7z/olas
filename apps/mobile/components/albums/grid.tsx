import { MasonryFlashList } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Dimensions, ImageStyle, Pressable, View, ViewStyle } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { Text } from '@/components/nativewindui/Text';

export default function AlbumsGrid({
    albums,
    onAlbumPress,
}: {
    albums: MediaLibrary.Album[];
    onAlbumPress: (album: MediaLibrary.Album) => void;
}) {
    const [assetsPerAlbum, setAssetsPerAlbum] = useState<{ [key: string]: { assets: MediaLibrary.Asset[]; totalCount: number } }>({});
    const albumAssetsFetched = useRef<Record<string, boolean>>({});

    useEffect(() => {
        albums.forEach(async (album) => {
            if (albumAssetsFetched.current[album.id]) return;
            const assets = await MediaLibrary.getAssetsAsync({ album: album, mediaType: ['photo', 'video'], first: 1 });
            setAssetsPerAlbum((prev) => ({ ...prev, [album.id]: { assets: assets.assets, totalCount: assets.totalCount } }));
            albumAssetsFetched.current[album.id] = true;
        });
    }, [albums]);

    const albumsWithAssets = albums.filter(
        (album) => assetsPerAlbum[album.id]?.totalCount > 0 && assetsPerAlbum[album.id]?.assets.length > 0
    );

    return (
        <MasonryFlashList
            data={albumsWithAssets}
            renderItem={({ item }) => (
                <AlbumListItem
                    album={item}
                    asset={assetsPerAlbum[item.id].assets[0]}
                    totalCount={assetsPerAlbum[item.id].totalCount}
                    onPress={() => onAlbumPress(item)}
                />
            )}
            numColumns={2}
        />
    );
}

export function AlbumListItem({
    album,
    asset,
    imageStyle,
    totalCount,
    containerStyle,
    onPress,
}: {
    album: MediaLibrary.Album;
    asset: MediaLibrary.Asset;
    totalCount: number;
    imageStyle?: ImageStyle;
    containerStyle?: ViewStyle;
    onPress: () => void;
}) {
    const size = Dimensions.get('window').width / 2;

    containerStyle ??= {
        width: size,
        height: size,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 10,
    };

    imageStyle ??= {
        width: '100%',
        flexGrow: 1,
        objectFit: 'cover',
        borderRadius: 10,
    };

    return (
        <Pressable style={containerStyle} onPress={onPress}>
            <Image source={{ uri: asset.uri }} style={imageStyle} />
            <Text variant="subhead" className="text-foreground">
                {album.title}
            </Text>
            <Text variant="caption2" className="text-muted-foreground">
                {totalCount}
            </Text>
        </Pressable>
    );
}
