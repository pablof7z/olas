import { useCallback } from 'react';
import { NDKEvent, NDKPrivateKeySigner, NDKRelaySet, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from './blossom';
import { useAtom, useSetAtom } from 'jotai';
import { metadataAtom, selectedMediaAtom, selectingMediaAtom, stepAtom, uploadingAtom } from '@/components/NewPost/store';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAppSettingsStore } from '@/stores/app';
import { mapAssetToPostMedia, mapImagePickerAssetToPostMedia } from '@/utils/media';
import useEditImage from '@/components/edit/hook';

type NewPostProps = {
    types: ('images' | 'videos')[];
    
    /**
     * Whether to force a 1:1 aspect ratio
     */
    square?: boolean;
}

export function useNewPost() {
    const { ndk } = useNDK();
    const activeBlossomServer = useActiveBlossomServer();
    const [step, setStep] = useAtom(stepAtom);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const { removeLocation } = useAppSettingsStore();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const setSelectingMedia = useSetAtom(selectingMediaAtom);

    const { editImage } = useEditImage();

    const launchImagePicker = useCallback(({types, square} : NewPostProps) => {
        // reset metadata
        setMetadata({ ...metadata, caption: '', removeLocation });

        setSelectingMedia(true);
        ImagePicker.launchImageLibraryAsync({
            mediaTypes: types,
            allowsMultipleSelection: false,
            exif: true,
        }).then((result) => {
            const selectedAsset = result.assets?.[0];
            
            if (selectedAsset?.type === 'video') {
                mapImagePickerAssetToPostMedia(selectedAsset).then((item) => {
                    setSelectedMedia([...selectedMedia, item]);
                    router.replace('/(publish)');
                });
            } else if (selectedAsset?.type === 'image') {
                mapImagePickerAssetToPostMedia(selectedAsset).then((item) => {
                    const newSelectedMedia = [...selectedMedia, item];
                    setSelectedMedia(newSelectedMedia);
                });
            } else {
                if (selectedMedia.length === 0) {
                    router.back();
                }
            }
        }).catch((e) => {
            console.error('error launching image picker', e);
        })
        .finally(() => {
            setSelectingMedia(false);
        });
    }, [ndk, activeBlossomServer, removeLocation, selectedMedia]);

    const launchCamera = useCallback(({types, square} : NewPostProps) => {
        // reset metadata
        setMetadata({ ...metadata, caption: '', removeLocation, tags: [] });

        ImagePicker.launchCameraAsync({
            mediaTypes: types,
            allowsMultipleSelection: true,
            videoMaxDuration: 5,
            selectionLimit: 6,
            allowsEditing: !!square,
            aspect: square ? [1, 1] : undefined,
            exif: true,
        }).then((result) => {
            if (result.assets) {
                Promise.all(result.assets.map(mapAssetToPostMedia)).then((sel) => {
                    setSelectedMedia(sel);
                    setStep(step + 1);
                    router.push('/publish');
                });
            }
        });
    }, [ndk, activeBlossomServer, removeLocation]);

    return { imagePicker: launchImagePicker, camera: launchCamera };
}
