import { useVideoPlayer, VideoView } from 'expo-video';
import { ComponentProps, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Image } from 'react-native';
import { Location, selectedMediaAtom } from './store';
import { ImageStyle } from 'expo-image';

import { router } from 'expo-router';
import { Text } from '../nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Edit2, Undo } from 'lucide-react-native';
import useEditImage from '../edit/hook';
import { useAtom } from 'jotai';
import { useEditImageStore } from '../edit/store';
import EditImageTool from '../edit/screen';
import { editIndexAtom } from '@/app/(publish)';

export type PostMedia = {
    id: string;
    originalUri: string;
    editedUri?: string;
    mediaType: 'photo' | 'video';
    mimeType?: string;
    sha256?: string;
    uploadedUri?: string;
    uploadedSha256?: string;
    blurhash?: string;
    contentMode: 'portrait' | 'landscape' | 'square';
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
    withEdit = true,
    maxWidth,
    maxHeight
}: {
    assets: PostMedia[];
    style?: ImageStyle;
    withEdit?: boolean;
    maxWidth?: number;
    maxHeight?: number;
}) {
    const multiple = assets.length > 1;
    const size = Dimensions.get('screen').width * 1.5;
    // const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);

    const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        multiple ? (
            <ScrollView horizontal className="w-full">
                {children}
            </ScrollView>
        ) : (
            <View style={{ width: '100%', maxHeight: size }} className="flex-1 flex-col bg-black">
                {children}
            </View>
        )
    );

    const insets = useSafeAreaInsets();
    maxHeight ??= (Dimensions.get('screen').height - insets.top - insets.bottom) / 2
    maxWidth ??= Dimensions.get('screen').width

    const containerStyle = useMemo<ViewStyle>(() => {
        if (multiple) return { flex: 1, width: size - 25, overflow: 'hidden', borderRadius: 20, marginLeft: 5, marginRight: 5, marginVertical: 2 };
        return { flex: 1, width: size, height: '100%', overflow: 'hidden' };
    }, [multiple, size]);

    const { editImage } = useEditImage();
    const resetEditImageStore = useEditImageStore(s => s.reset);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);

    // const handleRevertPress = useCallback((index: number) => {
    //     const newState = [...selectedMedia];
    //     newState[index] = { ...newState[index], uri: newState[index].uploadedUri };
    //     setSelectedMedia(newState);
    // }, [selectedMedia, setSelectedMedia]);

    const [editIndex, setEditIndex] = useAtom(editIndexAtom);
    
    const handlePress = useCallback((index: number) => {
        const asset = assets[index];
        
        editImage(asset.originalUri, (newUri: string) => {
            const newState = [...selectedMedia];
            newState[index] = { ...newState[index], editedUri: newUri };

            setSelectedMedia(newState);
            resetEditImageStore();
        });

        setEditIndex(index);
    }, [assets, selectedMedia, setSelectedMedia]);

    const completeEdit = useCallback(() => {
        setEditIndex(null);
    }, [setEditIndex]);

    return (
        <Container>
            <Modal visible={true} transparent={false} animationType="fade">
                <EditImageTool onComplete={completeEdit} />
            </Modal>
            {assets.map((asset, index) => (
                <View key={asset.id} className="flex-1 flex-row items-stretch justify-stretch" style={{ width: maxWidth, height: maxHeight }}>
                    {asset.mediaType === 'video' ? (
                        <VideoAlbumItem key={asset.id} uri={asset.editedUri ?? asset.originalUri} style={style} />
                    ) : (
                        <View style={{...containerStyle, position: 'relative'}}>
                            <PhotoAlbumItem
                                key={asset.id}
                                uri={asset.editedUri ?? asset.originalUri}
                                style={containerStyle}
                                resizeMode="contain"
                            />
                            
                            {withEdit && (
                                <View className="bg-black/50 rounded-full items-center absolute left-2 bottom-2 flex-row">
                                    {/* <Pressable  
                                        onPress={() => handleRevertPress(index)}
                                        className="px-4 py-2 rounded-full items-center flex-row gap-4"
                                    >
                                        <Undo size={18} color="white" />
                                    </Pressable> */}
                                    <Pressable  
                                        onPress={() => handlePress(index)}
                                        className="px-4 py-2 rounded-full items-center flex-row gap-4"
                                    >
                                        <Edit2 size={18} color="white" />
                                        <Text className="text-white font-bold">Edit</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            ))}
        </Container>
    );
}

export function PhotoAlbumItem({
    uri,
    style,
    ...props
}: {
    uri: string;
    style: ViewStyle;
} & ComponentProps<typeof Image>) {
    return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} {...props} />;
}

export function VideoAlbumItem({ uri, style, ...props }: { uri: string; style: ViewStyle } & ComponentProps<typeof View>) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return <VideoView player={player} style={style} className="w-full flex-1 flex-col items-stretch justify-stretch" {...props} />;
}
