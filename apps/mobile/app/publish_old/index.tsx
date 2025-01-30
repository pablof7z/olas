import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
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
import { useEditImageStore } from '@/components/edit/store';

export default function NewPostScreen() {
    const activeBlossomServer = useActiveBlossomServer();
    const { ndk } = useNDK();
    const { colors } = useColorScheme();

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
    
    const onEditComplete = useCallback(() => {
        console.log('running onEditComplete');
        resetEditImageStore();
    }, []);
    
    const imageUri = useEditImageStore(s => s.imageUri);
    const editOpen = useMemo(() => !!imageUri, [imageUri]);

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
                            <Button variant="primary" size="sm" onPress={addMoreMedia} disabled={selectedMedia.length === 0}>
                                <Text>Add</Text>
                            </Button>
                        )
                        return (
                            <Button variant="plain" onPress={next} disabled={selectedMedia.length === 0}>
                                <Text className="text-lg text-accent">Next</Text>
                            </Button>
                        );
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
