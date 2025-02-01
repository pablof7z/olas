import { View, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';

import { X } from 'lucide-react-native';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePostEditorStore } from '@/lib/post-editor/store';
import EditImageTool, { useEditImageStore } from '@/lib/post-editor/components/edit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostEditorMainScreen from '@/lib/post-editor/components/screen';
import { useEffect, useMemo } from 'react';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';

export default function NewPostScreen() {
    const { colors } = useColorScheme();

    const addMoreMedia = usePostEditorStore(s => s.newMediaFromSelector);
    const isEditing = usePostEditorStore(s => s.editingIndex !== null);
    const hasEditUri = useEditImageStore(s => s.imageUri !== null);
    const reset = usePostEditorStore(s => s.reset);

    const insets = useSafeAreaInsets();
    function abort() {
        router.back();
        reset();
    }

    const media = usePostEditorStore(s => s.media);
    const editingIndex = usePostEditorStore(s => s.editingIndex);
    const setImageUri = useEditImageStore(s => s.setImageUri);

    useEffect(() => {
        if (!media || editingIndex === null) return;
        const mediaItem = media?.[editingIndex];
        if (mediaItem?.mediaType === 'image') {
            setImageUri(mediaItem.uris[0]);
        }
    }, [media, editingIndex])

    const showEdit = useMemo(() => isEditing && hasEditUri, [isEditing, hasEditUri]);

    return (
        <>
            <StatusBar hidden={showEdit}/>
            <Stack.Screen
                options={{
                    headerTransparent: false,
                    headerShown: !showEdit,
                    title: 'New Post',
                    headerLeft: () => {
                        return (
                            <TouchableOpacity onPress={abort}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        );
                    },
                    headerRight: () => (
                        <Pressable onPress={() => addMoreMedia()}>
                            <Text className="text-lg text-primary">Add</Text>
                        </Pressable>
                    ),
                }}
            />

            {showEdit ? (
                <EditImageTool />
            ) : (
                <View className="flex-1" style={{ marginBottom: insets.bottom }}>
                    <PostEditorMainScreen />
                </View>
            )}
        </>
    );
}
