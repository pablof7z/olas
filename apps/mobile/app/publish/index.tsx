import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';

import { X } from 'lucide-react-native';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Text } from '@/components/nativewindui/Text';
import { metadataAtom, selectedMediaAtom, stepAtom } from '@/components/NewPost/store';
import ChooseContentStep from '@/components/NewPost/ChooseContentStep';
import { PostMetadataStep } from '@/components/NewPost/MetadataStep';
import { prepareMedia } from '@/components/NewPost/prepare';
import { uploadMedia } from '@/components/NewPost/upload';
import { Button } from '@/components/nativewindui/Button';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useColorScheme } from '@/lib/useColorScheme';
import { mountTagSelectorAtom } from '@/components/TagSelectorBottomSheet';
import { useEffect } from 'react';
import { BlurView } from 'expo-blur';

export default function NewPostScreen() {
    const activeBlossomServer = useActiveBlossomServer();
    const { ndk } = useNDK();
    const { colors } = useColorScheme();

    const [ mountTagSelector, setMountTagSelector ] = useAtom(mountTagSelectorAtom);
    const setMetadata = useSetAtom(metadataAtom);

    useEffect(() => {
        if (!mountTagSelector) setMountTagSelector(true);
        console.log('setting mountTagSelector to true');
    }, [mountTagSelector]);

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
        setMetadata({ caption: '', expiration: 0 });
        router.back();
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: false,
                    headerShown: true,
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
                        if (step === 1) return null;
                        return (
                            <Button variant="plain" onPress={next} disabled={selectedMedia.length === 0}>
                                <Text className="text-lg text-accent">Next</Text>
                            </Button>
                        );
                    },
                }}
            />
            <View className="flex-1 flex-row bg-card !p-0">
                {step === 0 && <ChooseContentStep />}
                {step === 1 && <PostMetadataStep />}
            </View>
        </>
    );
}
