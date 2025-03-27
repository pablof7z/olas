import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { View, StyleSheet } from 'react-native';

interface PreviewProps {
    selectedMedia: {
        type: 'image' | 'video';
        uri: string;
    };
}

export function Preview({ selectedMedia, ...props }: PreviewProps) {
    if (!selectedMedia) {
        return null;
    }

    if (selectedMedia.type === 'image') {
        return (
            <Image
                source={{ uri: selectedMedia.uri }}
                style={[styles.content, props.style]}
                contentFit="contain"
                accessible
                accessibilityLabel="Selected media preview"
                {...props}
            />
        );
    }

    if (selectedMedia.type === 'video') {
        return <PreviewVideo uri={selectedMedia.uri} {...props} />;
    }

    return null;
}

function PreviewVideo({ uri, ...props }: { uri: string }) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return <VideoView player={player} style={[styles.content, props.style]} contentFit="contain" nativeControls={false} {...props} />;
}

const styles = StyleSheet.create({
    content: {
        width: '100%',
        flex: 1,
    },
});
