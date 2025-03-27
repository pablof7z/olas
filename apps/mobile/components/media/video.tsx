import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { calcDimensions } from './image';
import { MediaDimensions } from './types';

const knownVideoDimensions: Record<string, MediaDimensions> = {};

export default function VideoComponent({
    url,
    loop,
    muted,
    dimensions,
    maxDimensions,
    forceDimensions,
    onPress,
    onLongPress,
    onFinished,
    autoplay,
}: {
    url: string;
    loop?: boolean;
    muted?: boolean;
    dimensions?: MediaDimensions;
    maxDimensions?: Partial<MediaDimensions>;
    forceDimensions?: Partial<MediaDimensions>;
    onPress?: (player: VideoPlayer) => void;
    onLongPress: () => void;
    onFinished?: () => void;
    autoplay?: boolean;
}) {
    let renderDimensions = forceDimensions || knownVideoDimensions[url];

    if (dimensions && !renderDimensions) {
        renderDimensions = calcDimensions(dimensions, maxDimensions);
    }

    loop ??= true;
    muted ??= true;
    const player = useVideoPlayer(url, (player) => {
        player.loop = loop;
        player.muted = muted;
        if (autoplay) player.play();
        player.addListener('playToEnd', () => {
            onFinished?.();
        });
    });

    const _style = useMemo(() => {
        const width = renderDimensions?.width ?? maxDimensions?.width ?? '100%';
        const height = renderDimensions?.height ?? maxDimensions?.height ?? '100%';
        return { width, height };
    }, [renderDimensions?.width, renderDimensions?.height, maxDimensions?.width, maxDimensions?.height, url]);

    return (
        <Pressable style={styles.container} onPress={() => onPress?.(player)} onLongPress={onLongPress}>
            <VideoView
                style={{ width: _style.width, height: _style.height, flex: 1 }}
                contentFit="cover"
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                nativeControls={false}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
