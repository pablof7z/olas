import type { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { Image, useImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import StoryStickersContainer from '../StoryStickersContainer';

import { urlIsVideo } from '@/utils/media';

interface SimpleStoryViewerProps {
    story: NDKStory;
    onMediaLoaded?: () => void;
    isActive?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SimpleStoryViewer({
    story,
    onMediaLoaded,
    isActive = true,
}: SimpleStoryViewerProps) {
    const imeta = story.imeta;

    if (!imeta?.url) return null;
    const isVideo = imeta?.m?.startsWith('video/') || urlIsVideo(imeta.url);

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            {isVideo ? (
                <VideoContent url={imeta.url} onMediaLoaded={onMediaLoaded} isActive={isActive} />
            ) : (
                <ImageContent url={imeta.url} onMediaLoaded={onMediaLoaded} />
            )}

            {/* Stickers Layer */}
            <StoryStickersContainer event={story} />
        </View>
    );
}

const VideoContent = ({
    url,
    onMediaLoaded,
    isActive = true,
}: {
    url: string;
    onMediaLoaded?: () => void;
    isActive?: boolean;
}) => {
    const videoSource = useVideoPlayer({ uri: url }, (player) => {
        player.loop = true;
        player.muted = false;

        // Signal that media has loaded when video is ready to play
        player.addListener('statusChange', () => {
            if (player.status === 'readyToPlay' && onMediaLoaded) {
                onMediaLoaded();
            }
        });

        return () => {
            player.removeAllListeners('statusChange');
        };
    });

    // Control playback based on active status
    useEffect(() => {
        if (videoSource && videoSource.status === 'readyToPlay') {
            if (isActive) {
                videoSource.play();
            } else {
                videoSource.pause();
            }
        }
    }, [isActive, videoSource, videoSource?.status]);

    return <VideoView player={videoSource} style={[styles.media]} contentFit="cover" />;
};

const ImageContent = ({ url, onMediaLoaded }: { url: string; onMediaLoaded?: () => void }) => {
    // Handle both remote and local file URIs
    // Local URIs will be in the format "file:///path/to/file"
    const imageSource = useImage({ uri: url });

    return (
        <Image
            style={styles.media}
            source={imageSource}
            contentFit="cover"
            onLoadStart={() => {}}
            onLoad={() => {}}
            onLoadEnd={() => {}}
            onError={() => {}}
            // Signal that media has loaded when image is displayed
            onDisplay={() => {
                if (onMediaLoaded) {
                    onMediaLoaded();
                }
            }}
        />
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    media: {
        flex: 1,
        width: screenWidth,
        height: screenHeight,
    },
    noMedia: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMediaText: {
        color: 'white',
        fontSize: 16,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    textContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 20,
    },
    touchContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        zIndex: 15,
    },
    prevTouch: {
        flex: 1,
    },
    nextTouch: {
        flex: 2,
    },
});
