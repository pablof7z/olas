import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PreviewProps {
    selectedMedia: {
        type: 'image' | 'video';
        uri: string;
    } | null;
    height: number;
    tapToUnmute?: boolean;
}

export function Preview({ selectedMedia, height, tapToUnmute = false }: PreviewProps) {
    return (
        <View style={[styles.previewContainer, { height }]}>
            {selectedMedia?.type === 'image' ? (
                <PreviewImage uri={selectedMedia.uri} />
            ) : selectedMedia?.type === 'video' ? (
                <PreviewVideo uri={selectedMedia.uri} tapToUnmute={tapToUnmute} />
            ) : null}
        </View>
    );
}

export function PreviewImage({ uri }: { uri: string }) {
    return (
        <Image
            source={{ uri }}
            style={styles.previewContent}
            contentFit="contain"
            accessible
            accessibilityLabel="Selected media preview"
        />
    );
}

export function PreviewVideo({ uri, tapToUnmute = false }: { uri: string; tapToUnmute?: boolean }) {
    const [isMuted, setIsMuted] = useState(true);

    const player = useVideoPlayer({ uri }, (player) => {
        player.loop = true;
        player.muted = isMuted;
        player.play();
    });

    const handleTap = () => {
        if (tapToUnmute) {
            setIsMuted(false);
            if (player) {
                player.muted = false;
            }
        }
    };

    if (tapToUnmute) {
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={handleTap} style={styles.previewContent}>
                <VideoView
                    player={player}
                    style={styles.previewContent}
                    nativeControls={false}
                    contentFit="contain"
                />
            </TouchableOpacity>
        );
    }

    return (
        <VideoView
            player={player}
            style={styles.previewContent}
            nativeControls={false}
            contentFit="contain"
        />
    );
}

const styles = StyleSheet.create({
    previewContainer: {
        width: '100%',
        backgroundColor: '#000',
        flex: 1,
    },
    previewContent: {
        width: '100%',
        height: '100%',
    },
});
