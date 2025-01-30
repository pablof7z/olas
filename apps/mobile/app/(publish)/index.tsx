import { View, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';

import { X } from 'lucide-react-native';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Text } from '@/components/nativewindui/Text';
import { metadataAtom, selectedMediaAtom, selectingMediaAtom, stepAtom, uploadingAtom, } from '@/components/NewPost/store';
import ChooseContentStep from '@/components/NewPost/ChooseContentStep';
import { PostMetadataStep } from '@/components/NewPost/MetadataStep';
import { Button } from '@/components/nativewindui/Button';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useColorScheme } from '@/lib/useColorScheme';
import { mountTagSelectorAtom } from '@/components/TagSelectorBottomSheet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNewPost } from '@/hooks/useNewPost';
import EditImageTool from '@/components/edit/screen';
import { useEditImageStore } from '@/components/edit/store';

export const editIndexAtom = atom(0);

export default function NewPostScreen() {
    const activeBlossomServer = useActiveBlossomServer();
    const { ndk } = useNDK();
    const { colors } = useColorScheme();
    const [editIndex, setEditIndex] = useAtom(editIndexAtom);

    const [ mountTagSelector, setMountTagSelector ] = useAtom(mountTagSelectorAtom);
    const setMetadata = useSetAtom(metadataAtom);

    useEffect(() => {
        if (!mountTagSelector) setMountTagSelector(true);
    }, [mountTagSelector]);

    const step = 1;

    // const next = async () => {
    //     if (step === 0 && selectedMedia.length === 0) return;
    //     if (step === 0) {
    //         const preparedMedia = await prepareMedia(selectedMedia);
    //         setSelectedMedia(await uploadMedia(preparedMedia, ndk, activeBlossomServer));
    //     }

    //     setStep(step + 1);
    // };

    const { imagePicker: newPost } = useNewPost();
    
    const setStep = useSetAtom(stepAtom);

    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const setSelectingMedia = useSetAtom(selectingMediaAtom);
    const [uploading, setUploading] = useAtom(uploadingAtom);

    function abort() {
        if (!uploading) {
            setStep(0);
            setSelectedMedia([]);
            setSelectingMedia(false);
            setUploading(false);
            setMetadata({ caption: '', expiration: 0 });
        }
        
        router.back();
    }

    function addMoreMedia() {
        console.log('addMoreMedia');
        newPost({ types: ['images', 'videos'] });
    }


    const resetEditImageStore = useEditImageStore(s => s.reset);

    const [editOpen, setEditOpen] = useState(false);
    
    const onEditComplete = useCallback(() => {
        console.log('running onEditComplete');
        resetEditImageStore();
        setEditOpen(false);
    }, []);
    
    const imageUri = useEditImageStore(s => s.imageUri);

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: false,
                    headerShown: editOpen ? false : true,
                    title: 'New Post',
                    headerLeft: () => {
                        if (step === 0) {
                            return null;
                        }

                        return (
                            <TouchableOpacity onPress={abort}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        );
                    },
                    headerRight: () => {
                        if (step === 1) return (
                            <Pressable onPress={addMoreMedia} disabled={selectedMedia.length === 0}>
                                <Text className="text-lg text-primary">Add</Text>
                            </Pressable>
                        )
                    },
                }}
            />
            {/* <View className="flex-1 flex-row bg-card !p-0"> */}
                {/* {step === 0 && <ChooseContentStep />} */}
                <PostMetadataStep />
            {/* </View> */}

        </>
    );
}
