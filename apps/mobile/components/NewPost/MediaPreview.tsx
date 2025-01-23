import { useVideoPlayer, VideoView } from 'expo-video';
import { ComponentProps, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { Location, selectedMediaAtom } from './store';
import { ImageStyle } from 'expo-image';

import { router } from 'expo-router';
import { Text } from '../nativewindui/Text';
import { Slider } from '../nativewindui/Slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { editImageAtom, editCallbackAtom } from '@/app/edit';
import { useSetAtom } from 'jotai';

export type MediaLibraryItem = {
    id: string;
    uri: string;
    mediaType: 'photo' | 'video';
    mimeType?: string;
    sha256?: string;
    uploadedUri?: string;
    uploadedSha256?: string;
    blurhash?: string;
    contentMode: 'portrait' | 'landscape';
    duration?: number;

    /**
     * Size in bytes
     */
    size?: number;

    location?: Location;

    width?: number;
    height?: number;
};

export function MediaPreview({
    assets,
    style,
    containerStyle,
}: {
    assets: MediaLibraryItem[];
    style?: ImageStyle;
    containerStyle?: ViewStyle;
}) {
    const multiple = assets.length > 1;
    const size = Dimensions.get('screen').width;
    const setSelectedMedia = useSetAtom(selectedMediaAtom);

    const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        multiple ? (
            <ScrollView horizontal className="w-full">
                {children}
            </ScrollView>
        ) : (
            <View className="w-full flex-1 flex-col">
                {children}
            </View>
        )
    );

    const onImageChange = useCallback((newUri: string, index: number) => {
        console.log('onImageChange', index, newUri);
        // replace the uri at the index
        const updatedAssets = [...assets];
        updatedAssets[index] = { ...updatedAssets[index], uri: newUri };
        setSelectedMedia(updatedAssets);
    }, [assets, setSelectedMedia]);

    const insets = useSafeAreaInsets();
    const width = Dimensions.get('screen').width;
    const height = (Dimensions.get('screen').height - insets.top - insets.bottom) / 2;

    return (
        <Container>
            {assets.map((asset, index) => (
                <View key={asset.id} className="flex-1 flex-row items-stretch justify-stretch" style={{ width: '100%', height }}>
                    {asset.mediaType === 'video' ? (
                        <VideoAlbumItem key={asset.id} uri={asset.uri} style={style} />
                    ) : (
                        <PhotoAlbumItem
                            key={asset.id}
                            uri={asset.uri}
                            style={{
                                flex: 1,
                                width: size - 40,
                                overflow: 'hidden',
                            }}
                            onImageChange={(newUri) => {
                                console.log('first onImageChange', index);
                                onImageChange(newUri, index)
                            }}
                        />
                    )}
                </View>
            ))}
        </Container>
    );
}

export function PhotoAlbumItem({
    uri,
    style,
    onImageChange,
    ...props
}: {
    uri: string;
    style: ViewStyle;
    onImageChange?: (newUri: string) => void;
} & ComponentProps<typeof Image>) {
    const setEditImage = useSetAtom(editImageAtom);
    const setEditCallback = useSetAtom(editCallbackAtom);

    const handlePress = useCallback(() => {
        setEditImage(uri);
        setEditCallback(onImageChange);
        router.push('/edit');
    }, [uri, onImageChange]);

    return (
        <Pressable onPress={handlePress} style={style} {...props}>
            <Image source={{ uri }} style={style} {...props} />
        </Pressable>
    );
}

export function VideoAlbumItem({ uri, style, ...props }: { uri: string; style: ViewStyle } & ComponentProps<typeof View>) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return <VideoView player={player} style={style} className="w-full flex-1 flex-col items-stretch justify-stretch" {...props} />;
}
