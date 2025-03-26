import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';
import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { mapNDKStickersToAppFormat, getCanvasDimensions, Sticker } from '../utils';
import ReadOnlySticker from './ReadOnlySticker';

interface StoryStickersContainerProps {
    event: NDKStory;
    onLayout?: (dimensions: { width: number; height: number }) => void;
}

/**
 * Container component that renders all stickers in a story
 */
export default function StoryStickersContainer({ event, onLayout }: StoryStickersContainerProps) {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const containerDimensions = Dimensions.get('window');
    const originalDimensions = getCanvasDimensions(event);

    // Extract stickers from the NDKStory event
    useEffect(() => {
        if (!event) return;

        try {
            const mappedStickers = mapNDKStickersToAppFormat(event);
            setStickers(mappedStickers);
        } catch (error) {
            console.error('Error mapping stickers:', error);
            setStickers([]);
        }
    }, [event]);

    // Handle layout change
    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        // setContainerDimensions({ width, height });

        if (onLayout) {
            onLayout({ width, height });
        }
    };

    // Don't render until we have container dimensions
    if (containerDimensions.width === 0 || containerDimensions.height === 0) {
        return <View style={styles.container} onLayout={handleLayout} />;
    }

    console.log('sticker', { containerDimensions, originalDimensions });

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {stickers.map((sticker) => (
                <ReadOnlySticker
                    key={sticker.id}
                    sticker={sticker}
                    containerDimensions={containerDimensions}
                    originalDimensions={originalDimensions}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        overflow: 'hidden',
    },
});
