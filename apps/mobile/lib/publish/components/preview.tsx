import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { VideoView } from 'expo-video';

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
                <Image
                    source={{ uri: selectedMedia.uri }}
                    style={styles.previewContent}
                    contentFit="contain"
                    accessible={true}
                    accessibilityLabel="Selected media preview"
                />
            ) : selectedMedia?.type === 'video' ? (
                <VideoView
                    source={{ uri: selectedMedia.uri }}
                    style={styles.previewContent}
                    videoStyle={{ resizeMode: 'contain' }}
                    shouldPlay={false}
                    isLooping
                    useNativeControls
                    accessible={true}
                    accessibilityLabel="Selected video preview"
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    previewContainer: {
        width: '100%',
        backgroundColor: '#000'
    },
    previewContent: {
        width: '100%',
        height: '100%'
    }
});
