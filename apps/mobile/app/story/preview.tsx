import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import StoryPreview from '@/lib/story-editor/components/preview';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleStoryViewer from '@/lib/stories/components/StoryViewer';
import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { Ionicons } from '@expo/vector-icons';

export default function StoryPreviewScreen() {
    const router = useRouter();
    const { path, type } = useLocalSearchParams<{
        path: string;
        type: 'photo' | 'video';
    }>();
    const [previewStory, setPreviewStory] = useState<NDKStory | null>(null);

    const handleClose = () => {
        router.back();
    };

    const handlePreviewClose = () => {
        setPreviewStory(null);
    };

    const handlePreviewStory = (story: NDKStory) => {
        setPreviewStory(story);
    };

    const insets = useSafeAreaInsets();

    // Log when the component renders with path and type
    useEffect(() => {
        console.log("StoryPreviewScreen rendered with:", { path, type });
    }, [path, type]);

    if (!path || !type) {
        return <View style={styles.container} />;
    }

    if (previewStory) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <SimpleStoryViewer story={previewStory} />
                <View style={[styles.closePreviewContainer, { top: insets.top + 10 }]}>
                    <TouchableOpacity 
                        onPress={handlePreviewClose} 
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StoryPreview 
                path={path} 
                type={type as 'photo' | 'video'} 
                onClose={handleClose}
                onPreview={handlePreviewStory}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    closePreviewContainer: {
        position: 'absolute',
        left: 20,
        zIndex: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    debugContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 10,
        zIndex: 30,
    },
    debugText: {
        color: 'white',
        fontSize: 12,
    },
    debugButton: {
        position: 'absolute',
        right: 20,
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
        zIndex: 100,
    }
});
