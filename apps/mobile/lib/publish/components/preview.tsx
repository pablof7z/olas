import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

interface PreviewProps {
    selectedMedia: {
        type: 'image' | 'video';
        uri: string;
    } | null;
    height: number;
}

export function Preview({ selectedMedia, height }: PreviewProps) {
    return (
        <View style={[styles.previewContainer, { height }]}>
            {selectedMedia?.type === 'image' ? (
                <PreviewImage uri={selectedMedia.uri} />
            ) : selectedMedia?.type === 'video' ? (
                <PreviewVideo uri={selectedMedia.uri} />
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
            accessible={true}
            accessibilityLabel="Selected media preview"
        />
    );
}

export function PreviewVideo({ uri }: { uri: string }) {
    const player = useVideoPlayer({ uri }, (player) => {
        player.loop = true;
        player.play();
    });

    return (
        <VideoView
            player={player}
            style={styles.previewContent}
        />
    );
}

const styles = StyleSheet.create({
    previewContainer: {
        width: '100%',
        backgroundColor: '#000',
        flex: 1
    },
    previewContent: {
        width: '100%',
        height: '100%'
    }
});
