import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function StoryPreview() {
    const { path, type } = useLocalSearchParams<{ path: string; type: string }>();
    const insets = useSafeAreaInsets();
    const player = useVideoPlayer({});

    // Format the path for local files
    const formattedPath = path?.startsWith('/') ? `file://${path}` : path;

    React.useEffect(() => {
        console.log('Preview received:', { path, formattedPath, type });
        if (type === 'video') {
            player.replace({ uri: formattedPath });
            player.play();
            player.loop = true;
        }
    }, [path, type]);

    const onClose = () => {
        router.back();
    };

    const onShare = () => {
        // TODO: Implement sharing functionality
        console.log('Share story');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.closeButton}
                    testID="close-button"
                >
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.previewContainer} testID="preview-container">
                {type === 'photo' ? (
                    <Image 
                        source={{ uri: formattedPath }} 
                        style={styles.media} 
                        resizeMode="contain"
                        testID="photo-preview"
                    />
                ) : (
                    <VideoView
                        style={styles.media}
                        player={player}
                        nativeControls={false}
                        contentFit="contain"
                        testID="video-player"
                    />
                )}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    onPress={onShare} 
                    style={styles.shareButton}
                    testID="share-button"
                >
                    <Ionicons name="arrow-forward-circle" size={60} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    footer: {
        padding: 20,
        alignItems: 'flex-end',
    },
    shareButton: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
}); 