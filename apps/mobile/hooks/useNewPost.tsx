import { useCallback } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-mobile";
import { useActiveBlossomServer } from "./blossom";
import { useAtom, useSetAtom } from "jotai";
import { metadataAtom, selectedMediaAtom, stepAtom, uploadingAtom } from "@/components/NewPost/store";
import { prepareMedia, uploadMedia } from "@/components/NewPost/upload";
import { MediaLibraryItem } from "@/components/NewPost/MediaPreview";
import * as ImagePicker from 'expo-image-picker';
import { toast } from "@backpackapp-io/react-native-toast";
import { mapAssetToMediaLibraryItem } from "@/components/NewPost/AlbumsView";
import { router } from "expo-router";
import { useAppSettingsStore } from "@/stores/app";

export function useNewPost() {
    const { ndk } = useNDK();
    const activeBlossomServer = useActiveBlossomServer();
    const setUploading = useSetAtom(uploadingAtom);
    const [ step, setStep ] = useAtom(stepAtom);
    const setSelectedMedia = useSetAtom(selectedMediaAtom);
    const { postType, removeLocation } = useAppSettingsStore();
    const [ metadata, setMetadata ] = useAtom(metadataAtom);

    const launchImagePicker = useCallback(() => {
        // reset metadata
        console.log('reset metadata', {postType, removeLocation});
        setMetadata({ ...metadata, type: postType, removeLocation, });

        ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 10,
        }).then((result) => {
            if (result.assets) {
                const sel = result.assets.map(mapAssetToMediaLibraryItem);
                setSelectedMedia(sel);
                console.log('setSelectedMedia', sel.length);
                setStep(step + 1);
                setUploading(true);
                router.push('/publish');
                return new Promise<void>(async (resolve) => {
                    try {
                        const preparedMedia = await prepareMedia(sel);
                        const uploadedMedia = await uploadMedia(preparedMedia, ndk, activeBlossomServer);
                        console.log('uploadedMedia', uploadedMedia);
                        setSelectedMedia(uploadedMedia);
                        setUploading(false);
                        console.log('setUploading(false)');
                    } catch (error) {
                        console.error('Error uploading media', error);
                        toast.error('Error uploading media');
                    } finally {
                        resolve();
                    }
                });
            }
        });
    }, [ndk, activeBlossomServer, postType, removeLocation]);

    return launchImagePicker;
}