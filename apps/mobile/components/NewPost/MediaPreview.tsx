import { useVideoPlayer, VideoView } from 'expo-video';
import { ComponentProps, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Image } from 'react-native';
import { Location } from './store';
import { ImageStyle } from 'expo-image';

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

    const contentStyle = multiple
        ? {
              width: '100%',
              height: '100%',
              paddingVertical: 10,
          }
        : {};

    style = multiple
        ? {
              flex: 1,
              width: size - 40,
              borderRadius: 12,
              overflow: 'hidden',
              padding: 50,
              marginLeft: 10,
          }
        : { width: size, flex: 1, resizeMode: 'contain' };

    if (assets.length === 1) {
        const asset = assets[0];

        return (
            <View className="w-full flex-1" style={contentStyle}>
                {asset.mediaType === 'video' ? (
                    <VideoAlbumItem uri={asset.uri} style={style} />
                ) : (
                    <PhotoAlbumItem uri={asset.uri} style={style} />
                )}
            </View>
        );
    }

    return (
        <ScrollView horizontal className="w-full">
            {assets.map((asset) => (
                <View key={asset.id} className="flex-1 flex-row items-stretch justify-stretch" style={contentStyle}>
                    {asset.mediaType === 'video' ? (
                        <VideoAlbumItem key={asset.id} uri={asset.uri} style={style} />
                    ) : (
                        <PhotoAlbumItem key={asset.id} uri={asset.uri} style={style} />
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

export function PhotoAlbumItem({ uri, style, ...props }: { uri: string; style: ViewStyle } & ComponentProps<typeof Image>) {
    return <Image source={{ uri }} style={style} className="" {...props} />;
}

export function VideoAlbumItem({ uri, style, ...props }: { uri: string; style: ViewStyle } & ComponentProps<typeof View>) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return <VideoView player={player} style={style} className="w-full flex-1 flex-col items-stretch justify-stretch" {...props} />;
}
