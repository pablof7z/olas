import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VideoContainer({ url, maxWidth, maxHeight }: { url: string; maxWidth: number; maxHeight: number }) {
    const videoSource = { uri: url };

    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = true;
        player.muted = true;
        player.addListener('statusChange', (status) => {
            if (player.status === 'readyToPlay') {
                player.play();
            }
        });
    });

    return (
        <VideoView
            style={{ flex: 1, width: '100%', height: maxHeight, maxWidth, maxHeight, flexGrow: 1 }}
            contentFit="cover"
            player={player}
            allowsFullscreen
            allowsPictureInPicture
        />
    );
}
