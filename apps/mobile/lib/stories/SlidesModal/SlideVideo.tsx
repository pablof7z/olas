import { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { View } from 'react-native';

import { isLoadingAtom, durationAtom } from './store';

export function SlideVideo({ imeta }: { imeta: NDKImetaTag }) {
    const setLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    useEffect(() => {
        console.log('slide video setting loading', imeta.url);
        setLoading(true);
    }, [imeta.url, setLoading]);

    // Use the player with minimal config to avoid type errors
    const player = useVideoPlayer({ uri: imeta.url }, (player) => {
        // Configure player after it's created
        player.play();

        // When the duration is available, set it
        if (player.duration > 0) {
            setDuration(player.duration * 1000);
            setLoading(false);
        }

        // Check status periodically to update duration when available
        const checkStatus = setInterval(() => {
            if (player.duration > 0) {
                setDuration(player.duration * 1000);
                setLoading(false);
                clearInterval(checkStatus);
            }
        }, 100);

        // Clean up interval on unmount
        return () => {
            clearInterval(checkStatus);
        };
    });

    return <VideoView player={player} contentFit="cover" style={{ flex: 1 }} />;
}
