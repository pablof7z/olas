import Video from 'expo-video';

// Render item for the FlashList grid preview
const renderPreviewItem = ({ item }: { item: (typeof fileData)[0] }) => {
    if (item.extension === 'mp4') {
        return <Video source={{ uri: item.uri }} controls resizeMode="contain" style={styles.previewVideo} autoPlay={false} />;
    }
    return <Image source={{ uri: item.uri }} style={styles.previewImage} />;
};
