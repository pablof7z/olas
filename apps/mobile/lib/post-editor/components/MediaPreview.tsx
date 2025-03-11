import { useVideoPlayer, VideoView } from 'expo-video';
import { ComponentProps, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Image } from 'react-native';
import { ImageStyle } from 'expo-image';

import { Text } from '@/components/nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Edit2, Trash2, Undo } from 'lucide-react-native';
import { useAtom } from 'jotai';
// import EditImageTool from '@/lib/post-editor/components/edit';
import { PostMedia } from '../types';
import { usePostEditorStore } from '../store';
import EditImageTool, { useEditImageStore } from './edit';
import ImageCropPicker from 'react-native-image-crop-picker';
import { router } from 'expo-router';

export function MediaPreview({
    withEdit = true,
    limit,
    maxWidth,
    maxHeight,
    forceImage = false
}: {
    withEdit?: boolean;
    limit?: number;
    maxWidth?: number;
    maxHeight?: number;
    forceImage?: boolean;
}) {
    const media = usePostEditorStore(s => s.media);
    const mediaToRender = limit ? media.slice(0, limit) : media;
    const multiple = mediaToRender.length > 1;
    const size = Dimensions.get('screen').width * 1.5;

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

    const setMedia = usePostEditorStore(s => s.setMedia);

    const handleRevertPress = useCallback((index: number) => {
        const newState = [...media];
        newState[index].uris.shift();
        setMedia(newState);
    }, [media, setMedia]);
    
    const setEditingIndex = usePostEditorStore(s => s.setEditingIndex);
    const setEditImageUri = useEditImageStore(s => s.setImageUri);

    const edit = useCallback((index: number) => {
        const item = media[index];
        const lastUri = item.uris[item.uris.length - 1];
        setEditImageUri(lastUri);
        setEditingIndex(index);
    }, [media, setEditImageUri, setEditingIndex]);

    const deleteMedia = useCallback((index: number) => {
        const newState = [...media];
        newState.splice(index, 1);
        setMedia(newState);

        if (newState.length === 0) {
            router.replace("/(home)");
        }
    }, [media, setMedia, setEditingIndex]);

    let mediaUri = mediaToRender[0]?.uris?.[0];
    let mediaType = mediaToRender[0]?.mediaType;
    if (mediaType === 'video' && forceImage && mediaToRender[0].localThumbnailUri) {
        mediaUri = mediaToRender[0].localThumbnailUri;
        mediaType = 'image';
    }

    return (
        <Container>
            {mediaToRender.map((item, index) => (
                <View key={item.id} className="flex-1 flex-row items-stretch justify-stretch" style={{ width: maxWidth, height: maxHeight }}>
                    {item.mediaType === 'video' ? (
                        <VideoAlbumItem uri={mediaUri} style={{ flex: 1, width: '100%', height: '100%'}} />
                    ) : (
                        <View style={{...containerStyle}}>
                            <PhotoAlbumItem
                                key={item.id}
                                uri={mediaUri}
                                style={containerStyle}
                                resizeMode="contain"
                            />
                            
                            {withEdit && (
                                <View className="rounded-full items-stretch absolute gap-1 left-0 right-0 bottom-0 flex-row m-2">
                                    {item.uris.length > 1 && (
                                        <Pressable  
                                            onPress={() => handleRevertPress(index)}
                                            className="px-4 py-3 rounded-full items-center flex-row gap-4 bg-black/50 "
                                        >
                                            <Undo size={18} color="white" />
                                        </Pressable>
                                    )}
                                    <Pressable  
                                        onPress={() => edit(index)}
                                        className="px-4 py-3 rounded-full items-center flex-row gap-4 bg-black/50"
                                    >
                                        <Edit2 size={18} color="white" />
                                        <Text className="text-white font-bold">Edit</Text>
                                    </Pressable>
                                        
                                    <Pressable  
                                        onPress={() => deleteMedia(index)}
                                        className="px-4 py-3 rounded-full items-center flex-row gap-4 bg-black/50"
                                    >
                                        <Trash2 size={18} color="white" />
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

    return <VideoView
        player={player}
        nativeControls={false}
        style={style} className="w-full bg-red-500 flex-1 flex-col items-stretch justify-stretch" {...props} />;
}
