import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAtomValue } from 'jotai';
import { X } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { scrollDirAtom } from './Feed/store';
import { Button } from './nativewindui/Button';
import { Text } from './nativewindui/Text';

import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingBottom: 10,
        borderTopWidth: 1,
    },
});

export default function UploadingIndicator() {
    const bottomHeight = useBottomTabBarHeight();
    const isPublishing = useEditorStore((s) => s.isPublishing);
    const reset = useEditorStore((s) => s.reset);
    const { colors } = useColorScheme();
    const scrollDir = useAtomValue(scrollDirAtom);

    const animStyle = useAnimatedStyle(() => {
        if (scrollDir === 'up') {
            return {
                transform: [{ translateY: withTiming(-bottomHeight, { duration: 200 }) }],
            };
        }

        return {
            transform: [{ translateY: withTiming(0, { duration: 200 }) }],
        };
    }, [bottomHeight, scrollDir]);

    if (!isPublishing) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { borderTopColor: colors.grey3, backgroundColor: colors.card },
                animStyle,
            ]}
        >
            <Pressable
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    height: 70,
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                }}
            >
                <View style={{ height: 60, width: 60, borderRadius: 10, overflow: 'hidden' }}>
                    <MediaPreview />
                </View>

                <Status />

                <Button variant="plain" onPress={reset}>
                    <X size={24} color={colors.foreground} />
                </Button>
            </Pressable>
        </Animated.View>
    );
}

function MediaPreview() {
    const media = useEditorStore((s) => s.media);
    if (!media.length) return null;

    const firstMedia = media[0];
    return (
        <View style={{ width: '100%', height: '100%' }}>
            {firstMedia.mediaType === 'image' && (
                <Image
                    source={{ uri: firstMedia.uris[0] }}
                    style={{ width: '100%', height: '100%' }}
                />
            )}
        </View>
    );
}

function Status() {
    const state = useEditorStore((s) => s.state);
    const caption = useEditorStore((s) => s.caption);
    const error = useEditorStore((s) => s.error);

    return (
        <View className="flex-1 flex-col items-start">
            {error ? (
                <Text className="text-sm text-red-500">{error}</Text>
            ) : (
                <Text className="text-lg font-medium">{stateLabel(state)}</Text>
            )}
            <Text variant="caption1" numberOfLines={1} className="text-muted-foreground">
                {caption}
            </Text>
        </View>
    );
}

function stateLabel(state: string) {
    if (state === 'uploading') {
        return 'Uploading';
    }

    return state;
}
