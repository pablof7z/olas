import { View, StyleSheet } from 'react-native';
import { Preview } from './Preview';
import Toolbar from './toolbar';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface PreviewContainerProps {
    selectedMedia: {    
        type: 'image' | 'video';
        uri: string;
    } | null;
    height: number;
}

export default function PreviewContainer({ selectedMedia, height }: PreviewContainerProps) {
    return (
        <View style={[styles.previewContainer, { height }]}>
                <Animated.View 
                    style={styles.previewWrapper}
                >
                    <Preview selectedMedia={selectedMedia} />
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
    }
});