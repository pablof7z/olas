import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Video from 'react-native-video';

interface PreviewProps {
    selectedMedia: {
        type: 'image' | 'video';
        uri: string;
    } | null;
}

export function Preview({ selectedMedia }: PreviewProps) {
    if (!selectedMedia) {
        return null;
    }

    if (selectedMedia.type === 'image') {
        return (
            <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.content}
                contentFit="contain"
                accessible={true}
                accessibilityLabel="Selected media preview"
            />
        );
    }

    if (selectedMedia.type === 'video') {
        return (
            <Video
                source={{ uri: selectedMedia.uri }}
                style={styles.content}
                resizeMode="contain"
                controls
                repeat
                paused={true}
                accessible={true}
                accessibilityLabel="Selected video preview"
            />
        );
    }

    return null;
}

const styles = StyleSheet.create({
    content: {
        width: '100%',
        flex: 1
    }
});
