import { useEffect } from 'react';
import { View } from 'react-native';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as MediaLibrary from 'expo-media-library';
import { albumPermission, albumsAtom, selectedMediaAtom, stepAtom, uploadingAtom, uploadingPromiseAtom } from './store';
import AlbumsView, { mapAssetToMediaLibraryItem } from './AlbumsView';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '../nativewindui/Button';
import { Image } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { prepareMedia, uploadMedia } from './upload';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { toast } from '@backpackapp-io/react-native-toast';

export default function ChooseContentStep() {
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const setAlbumPermission = useSetAtom(albumPermission);
    const setAlbums = useSetAtom(albumsAtom);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const [step, setStep] = useAtom(stepAtom);

    async function getAlbums() {
        console.log('getAlbums', permissionResponse);
        if (permissionResponse?.status !== 'granted') {
            await requestPermission();
        } else {
            setAlbumPermission(true);
        }
        const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
            includeSmartAlbums: true,
        });
        setAlbums(fetchedAlbums);
    }

    useEffect(() => {
        getAlbums();
    }, []);

    const { ndk } = useNDK();
    const activeBlossomServer = useActiveBlossomServer();
    const setUploading = useSetAtom(uploadingAtom);

    const launchImagePicker = () => {
        ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 10,
        }).then((result) => {
            if (result.assets) {
                const sel = result.assets.map(mapAssetToMediaLibraryItem);
                setSelectedMedia(sel);

                setStep(step + 1);
                setUploading(true);
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
    };

    const { colors } = useColorScheme();

    useEffect(() => {
        launchImagePicker();
    }, []);

    return (
        <View className="flex-1 grow">
            {albumPermission && false ? (
                <AlbumsView />
            ) : (
                <View className="flex-1 grow items-center justify-center">
                    <View className="mb-4 opacity-40">
                        <Image size={128} color={colors.foreground} strokeWidth={1.25} />
                    </View>

                    <Button variant="accent" size="lg" onPress={launchImagePicker}>
                        <Text className="text-white">Choose Content</Text>
                    </Button>
                </View>
            )}
        </View>
    );
}
