import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Preview } from './Preview';
import Toolbar from './toolbar';

interface PreviewContainerProps {
    selectedMedia: {
        type: 'image' | 'video';
        uri: string;
    }[];
    height: number;
}

const dimensions = Dimensions.get('window');

export default function PreviewContainer({ selectedMedia, height }: PreviewContainerProps) {
    return (
        <View style={[styles.previewContainer, { height }]}>
            <Animated.View style={styles.previewWrapper}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    {selectedMedia.map((media, index) => (
                        <View
                            key={`${media.uri}-${index}`}
                            style={[styles.mediaContainer, { width: dimensions.width * 0.8 }]}
                        >
                            <Preview selectedMedia={media} />
                        </View>
                    ))}
                </ScrollView>
            </Animated.View>
            <Toolbar />
        </View>
    );
}

const styles = StyleSheet.create({
    previewContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
        flexDirection: 'column',
    },
    previewWrapper: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    mediaContainer: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
});
