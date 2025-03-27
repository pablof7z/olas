import { NDKEvent, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

import { EventStickerStyle } from './styles';

import RelativeTime from '@/components/relative-time';
import * as User from '@/components/ui/user';

// Get screen width for responsive sizing
const { width: screenWidth } = Dimensions.get('window');

export default function EventStickerKindVideo({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: any;
    styles: EventStickerStyle;
}) {
    const ndkVideo = useMemo(() => NDKVideo.from(event), [event]);

    // Get video URL and dimensions from imetas
    const { videoUrl, aspectRatio } = useMemo(() => {
        let videoUrl = '';
        let width = 16;
        let height = 9;

        if (ndkVideo.imetas && ndkVideo.imetas.length > 0) {
            const imeta = ndkVideo.imetas[0];

            // Get URL
            if (imeta.url) {
                videoUrl = imeta.url;
            }

            // Get dimensions if available
            if (imeta.dim) {
                const dimensions = imeta.dim.split('x');
                if (dimensions.length === 2) {
                    const w = parseInt(dimensions[0], 10);
                    const h = parseInt(dimensions[1], 10);
                    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                        width = w;
                        height = h;
                    }
                }
            }
        }

        return {
            videoUrl,
            aspectRatio: height / width,
        };
    }, [ndkVideo]);

    const player = useVideoPlayer(videoUrl || '', (player) => {
        // Configure player to autoplay muted and loop
        player.muted = true;
        player.loop = true;
        player.play();
    });

    // Calculate video height based on aspect ratio
    const videoHeight = useMemo(() => {
        return screenWidth * aspectRatio;
    }, [aspectRatio]);

    return (
        <View style={[_styles.outerContainer, styles.container]}>
            <View style={[_styles.videoContainer, { height: videoHeight }]}>
                {videoUrl && <VideoView player={player} style={_styles.video} contentFit="cover" />}

                <View style={_styles.overlayContainer}>
                    {ndkVideo.content && (
                        <Text style={[_styles.description, styles.text]} numberOfLines={3}>
                            {ndkVideo.content}
                        </Text>
                    )}

                    <View style={_styles.footer}>
                        <View style={_styles.userContainer}>
                            <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={24} />
                            <User.Name
                                pubkey={event.pubkey}
                                userProfile={userProfile}
                                style={[_styles.username, styles.author && styles.author.nameStyle]}
                            />
                        </View>

                        {event.created_at && <RelativeTime timestamp={event.created_at} style={_styles.timestamp} />}
                    </View>
                </View>
            </View>
        </View>
    );
}

const _styles = StyleSheet.create({
    outerContainer: {
        width: screenWidth,
        maxWidth: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: 'white',
    },
    videoContainer: {
        width: '100%',
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlayContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 22,
        color: '#fff',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    username: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
    },
    timestamp: {
        fontSize: 12,
        color: '#eee',
    },
});
