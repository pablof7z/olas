import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MediaDimensions } from './types';
import { calcDimensions } from './image';

let knownVideoDimensions: Record<string, MediaDimensions> = {};

export default function VideoComponent({
    url,
    loop,
    muted,
    dimensions,
    maxDimensions,
    onPress,
    onLongPress,
    onFinished,
}: {
    url: string;
    loop?: boolean;
    muted?: boolean;
    dimensions?: MediaDimensions;
    maxDimensions?: Partial<MediaDimensions>;
    onPress?: (player: VideoPlayer) => void;
    onLongPress: () => void;
    onFinished?: () => void;
}) {
    let renderDimensions = knownVideoDimensions[url];

    if (dimensions && !renderDimensions) {
        renderDimensions = calcDimensions(dimensions, maxDimensions);
    }
    
    const videoSource = { uri: url };
    loop ??= true;
    muted ??= true;
    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = loop;
        player.muted = muted;
        player.play();
        player.addListener('playingChange', (playing) => {
            console.log(playing);
        });
        player.addListener('playToEnd', () => {
            onFinished?.();
        });
    });

    const _style = useMemo(() => {
        let width = renderDimensions?.width ?? maxDimensions?.width;
        let height = renderDimensions?.height ?? maxDimensions?.height;
        return { width, height };
    }, [renderDimensions?.width, renderDimensions?.height, maxDimensions?.width, maxDimensions?.height, url])


    return (
        <Pressable style={styles.container} onPress={() => onPress?.(player)} onLongPress={onLongPress}>
            <VideoView
                style={{ height: _style.height, width: _style.width }}
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
    }
});