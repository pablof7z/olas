import React, { useCallback } from 'react';
import { View, Image } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { Camera, Plus } from 'lucide-react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { Button } from '@/components/nativewindui/Button';
import { avatarAtom, usernameAtom } from '../store';

export function AvatarChooser() {
    const username = useAtomValue(usernameAtom);
    const [avatar, setAvatar] = useAtom(avatarAtom);
    
    const chooseImage = useCallback(() => {
        ImageCropPicker.openPicker({
            width: 400,
            height: 400,
            cropping: true,
            multiple: false,
            mediaType: 'photo',
            includeExif: false,
        }).then((image) => {
            setAvatar(image.path);
        });
    }, []);

    const openCamera = useCallback(() => {
        ImageCropPicker.openCamera({
            width: 400,
            height: 400,
            cropping: true,
            multiple: false,
            mediaType: 'photo',
            includeExif: false,
        }).then((image) => {
            setAvatar(image.path);
        });
    }, []);

    return (
        <View className="h-24 w-28 flex-row gap-4 items-center justify-center">
            <Button
                size="icon"
                variant="accent"
                className="!rounded-full" 
                onPress={openCamera}
            >
                <Camera size={24} color="white" />
            </Button>
            
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-accent bg-muted">
                <Image
                    source={{ uri: avatar || 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=' + username }}
                    className="h-full w-full rounded-full object-cover"
                />
            </View>

            <Button
                size="icon"
                variant="accent"
                className="!rounded-full" 
                onPress={chooseImage}
            >
                <Plus size={24} color="white" />
            </Button>
        </View>
    );
} 