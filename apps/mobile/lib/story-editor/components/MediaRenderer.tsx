import React from 'react';
import { VideoView } from 'expo-video';
import { Image } from 'expo-image';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface MediaRendererProps {
    type: 'photo' | 'video';
    path: string;
    player: any;
    containerWidthValue: number;
    onImageLoad: (event: any) => void;
}

export default function MediaRenderer({ type, path, player, containerWidthValue, onImageLoad }: MediaRendererProps) {
    return type === 'photo' ? (
        <Animated.View style={[{ flex: 1, width: '100%', height: '100%' }]}>
            <Image
                source={{ uri: path }}
                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                contentFit="cover"
                onLoad={onImageLoad}
            />
        </Animated.View>
    ) : (
        <Animated.View style={[{ flex: 1, width: containerWidthValue, height: '100%' }]}>
            <VideoView
                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                player={player}
                contentFit="cover"
                nativeControls={false}
            />
        </Animated.View>
    );
}
