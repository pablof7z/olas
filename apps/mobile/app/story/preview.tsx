import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import StoryPreview from '@/lib/story-editor/components/preview';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function StoryPreviewScreen() {
    const router = useRouter();
    const { path, type } = useLocalSearchParams<{
        path: string;
        type: 'photo' | 'video';
    }>();

    const handleClose = () => {
        router.back();
    };

    const insets = useSafeAreaInsets();

    if (!path || !type) {
        return <View style={styles.container} />;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StoryPreview path={path} type={type as 'photo' | 'video'} onClose={handleClose} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});
