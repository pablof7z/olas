import type { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface SlideVideoProps {
    imeta: NDKImetaTag;
    onNextSlide?: () => void;
    onContentLoaded: (duration: number) => void;
    isActiveSlide?: boolean;
}

export function SlideVideo({
    imeta,
    onNextSlide,
    onContentLoaded,
    isActiveSlide = true,
}: SlideVideoProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const durationSet = useRef(false);

    // Reset states when component unmounts or slide changes
    useEffect(() => {
        return () => {
            setIsPlaying(false);
            durationSet.current = false;
        };
    }, [imeta.url]);

    // Use the player with minimal config to avoid type errors
    const player = useVideoPlayer({ uri: imeta.url }, (player) => {
        // Configure player after it's created
        player.play();

        // Track video playing status
        player.addListener('statusChange', () => {
            // Check if video is ready to play
            if (player.status === 'readyToPlay' && !isPlaying) {
                setIsPlaying(true);

                // Only set duration and mark as loaded when video starts playing
                if (player.duration > 0 && !durationSet.current) {
                    // Round to milliseconds
                    const videoDuration = Math.round(player.duration * 1000);
                    console.log('Video duration set:', videoDuration);
                    onContentLoaded(videoDuration);
                    durationSet.current = true;
                }
            }
        });

        // Listen for video completion
        player.addListener('playToEnd', () => {
            // Move to next slide when video finishes
            if (onNextSlide) {
                onNextSlide();
            }
        });

        // Clean up listeners on unmount
        return () => {
            player.removeAllListeners('statusChange');
            player.removeAllListeners('playToEnd');
        };
    });

    // Control playback based on active status
    useEffect(() => {
        if (player && player.status === 'readyToPlay') {
            if (isActiveSlide) {
                player.play();
            } else {
                player.pause();
            }
        }
    }, [isActiveSlide, player, player?.status]);

    return <VideoView player={player} contentFit="cover" style={{ flex: 1 }} />;
}
