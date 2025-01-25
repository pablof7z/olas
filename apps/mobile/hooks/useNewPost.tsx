import { useCallback } from 'react';
import { NDKEvent, NDKPrivateKeySigner, NDKRelaySet, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from './blossom';
import { useAtom, useSetAtom } from 'jotai';
import { metadataAtom, selectedMediaAtom, stepAtom, uploadingAtom } from '@/components/NewPost/store';
import { prepareMedia } from '@/components/NewPost/prepare';
import { uploadMedia } from '@/components/NewPost/upload';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '@backpackapp-io/react-native-toast';
import { router } from 'expo-router';
import { useAppSettingsStore } from '@/stores/app';
import { mapAssetToMediaLibraryItem } from '@/utils/media';
import ImageCropPicker from 'react-native-image-crop-picker';

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
    const setUploading = useSetAtom(uploadingAtom);
    const [step, setStep] = useAtom(stepAtom);
    const setSelectedMedia = useSetAtom(selectedMediaAtom);
    const { removeLocation } = useAppSettingsStore();
    const [metadata, setMetadata] = useAtom(metadataAtom);

    const launchImagePicker = useCallback(({types, square} : NewPostProps) => {
        // reset metadata
        setMetadata({ ...metadata, caption: '', removeLocation });

        ImagePicker.launchImageLibraryAsync({
            mediaTypes: types,
            allowsMultipleSelection: true,
            selectionLimit: 6,
            allowsEditing: !!square,
            aspect: square ? [1, 1] : undefined,
            exif: true,
        }).then((result) => {
            if (result.assets) {
                Promise.all(result.assets.map(mapAssetToMediaLibraryItem)).then((sel) => {
                    setSelectedMedia(sel);
                    setStep(step + 1);
                    setUploading(true);
                    router.push('/publish');
                });
            }
        });
    }, [ndk, activeBlossomServer, removeLocation]);

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
                Promise.all(result.assets.map(mapAssetToMediaLibraryItem)).then((sel) => {
                    setSelectedMedia(sel);
                    setStep(step + 1);
                    setUploading(true);
                    router.push('/publish');
                });
            }
        });
    }, [ndk, activeBlossomServer, removeLocation]);

    return { imagePicker: launchImagePicker, camera: launchCamera };
}
