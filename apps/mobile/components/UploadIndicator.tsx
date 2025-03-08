import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { usePostEditorStore } from './NewPost/store';
import { useColorScheme } from '@/lib/useColorScheme';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from './nativewindui/Text';
import { Button } from './nativewindui/Button';
import { X } from 'lucide-react-native';
import { MediaPreview as PostEditorMediaPreview } from '@/lib/post-editor/components/MediaPreview';
import { useAtomValue } from 'jotai';
import { scrollDirAtom } from './Feed/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingBottom: 10,
        borderTopWidth: 1,
    }
});

export default function UploadingIndicator() {
    const bottomHeight = useBottomTabBarHeight();
    const readyToPublish = usePostEditorStore(s => s.readyToPublish);
    const uploading = usePostEditorStore(s => s.state === 'uploading');
    const metadata = usePostEditorStore(s => s.metadata);
    const uploadError = usePostEditorStore(s => s.error);
    const resetPostEditor = usePostEditorStore(s => s.reset);
    const { colors } = useColorScheme();
    const scrollDir = useAtomValue(scrollDirAtom);

    const animStyle = useAnimatedStyle(() => {
        if (scrollDir === 'up') {
            return {
                transform: [{ translateY: withTiming(-bottomHeight, { duration: 200 }) }],
            }
        }

        return {
            transform: [{ translateY: withTiming(0, { duration: 200 }) }],
        }
    }, [bottomHeight, scrollDir]);

    if (!readyToPublish) return null;

    return (
        <Animated.View
            style={[ styles.container, { borderTopColor: colors.grey3, backgroundColor: colors.card }, animStyle]}
        >
            <Pressable
            style={{ paddingHorizontal: 10, paddingVertical: 5, height: 70, flexDirection: 'row', gap: 10, alignItems: 'center' }}
        >
            <View style={{ height: 60, width: 60, borderRadius: 10, overflow: 'hidden'}}>
                <PostEditorMediaPreview limit={1} withEdit={false} maxWidth={60} maxHeight={60} />
            </View>

            <View className="flex-col items-start flex-1">
                {uploadError ? (
                    <Text className="text-red-500 text-sm">{uploadError}</Text>
                ) : (
                    <Text className="text-lg font-medium">
                        {uploading ? 'Uploading' : 'Publishing'}
                    </Text>
                )}
                <Text variant="caption1" numberOfLines={1} className="text-muted-foreground">{metadata.caption}</Text>
            </View>


            <Button variant="plain" onPress={resetPostEditor}>
                    <X size={24} color={colors.foreground} />
                </Button>
            </Pressable>
        </Animated.View>
    )
}