import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';

import { ChevronLeft, ImageIcon, VideoIcon, X } from 'lucide-react-native';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Text } from '@/components/nativewindui/Text';
import { PostTypeBottomSheet } from '@/components/NewPost/PostTypeBottomSheet';
import { albumsAtom, metadataAtom, selectedMediaAtom, stepAtom } from '@/components/NewPost/store';
import ChooseContentStep from '@/components/NewPost/ChooseContentStep';
import { PostMetadataStep } from '@/components/NewPost/MetadataStep';
import { LocationBottomSheet } from '@/components/NewPost/LocationBottomSheet';
import { prepareMedia, uploadMedia } from '@/components/NewPost/upload';
import { AlbumsBottomSheet } from '@/components/NewPost/AlbumsBottomSheet';
import { Button } from '@/components/nativewindui/Button';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';

export default function NewPostScreen() {
    const activeBlossomServer = useActiveBlossomServer();
    const { ndk } = useNDK();

    const [metadata, setMetadata] = useAtom(metadataAtom);

    const step = 1;

    const next = async () => {
        if (step === 0 && selectedMedia.length === 0) return;
        if (step === 0) {
            const preparedMedia = await prepareMedia(selectedMedia);
            setSelectedMedia(await uploadMedia(preparedMedia, ndk, activeBlossomServer));
        }

        setStep(step + 1);
    };

    const setStep = useSetAtom(stepAtom);

    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);

    function abort() {
        setStep(0);
        setSelectedMedia([]);
        setMetadata({ caption: '', expiration: 0, type: 'high-quality' });
        router.back();
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'New Post',
                    headerLeft: () => {
                        if (step === 0) {
                            return null;
                        }

                        return (
                            <TouchableOpacity onPress={abort}>
                                <X size={24} />
                            </TouchableOpacity>
                        );
                    },
                    headerRight: () => {
                        if (step === 1) return null;
                        return (
                            <Button variant="plain" onPress={next} disabled={selectedMedia.length === 0}>
                                <Text className="text-lg text-accent">Next</Text>
                            </Button>
                        );
                    },
                }}
            />
            <View style={styles.container} className="flex-1 flex-row bg-card !p-0">
                {step === 0 && <ChooseContentStep />}
                {step === 1 && <PostMetadataStep />}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        flex: 1,
        borderRadius: 12,
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    uploadContainer: {},
    buttonContainer: {
        flex: 1,
        gap: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
    textInput: {
        marginTop: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    audioContainer: {
        position: 'relative',
        width: '100%',
        padding: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    audioText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
});
