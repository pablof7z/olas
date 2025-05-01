import { Image } from 'expo-image';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { MediaDimensions } from './types';

import useImagePreload from '@/hooks/useImagePreload';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Text } from '../nativewindui/Text';

/**
 * This keeps a record of the known image heights for a given url.
 */
const knownImageDimensions: Record<string, MediaDimensions> = {};

export function calcDimensions(
    dimensions: MediaDimensions,
    maxDimensions: Partial<MediaDimensions>
) {
    let { width, height } = dimensions;
    // Provide default values if undefined
    const maxWidth = maxDimensions.width ?? 100;
    const maxHeight = maxDimensions.height ?? 100;

    const aspectRatio = width / height;

    const isLandscape = width > height;
    const isOverPortraitThreshold = height / width > 1.5;

    if (isOverPortraitThreshold || isLandscape) {
        width = maxWidth;
        height = Math.min(maxHeight, Math.round(maxWidth / aspectRatio));
    } else {
        height = maxHeight;
        width = maxWidth;
    }

    return { width, height };
}

const time = Date.now();

// Helper to safely floor possibly undefined numbers
function safeFloor(n: number | undefined) {
    return typeof n === 'number' ? Math.floor(n) : 100;
}

export default function ImageComponent({
    url,
    blurhash,
    dimensions,
    maxDimensions,
    forceDimensions,
    forceProxy,
    priority,
    contentFit,
    onPress,
    onLongPress,
    onLoad,
    className,
    style,
    ...props
}: {
    url: string;
    blurhash?: string;
    dimensions?: MediaDimensions;
    priority?: 'low' | 'normal' | 'high';
    contentFit?: 'contain' | 'cover';
    maxDimensions?: Partial<MediaDimensions>;
    forceDimensions?: Partial<MediaDimensions>;
    forceProxy?: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onLoad?: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    if (!maxDimensions) maxDimensions = { width: Dimensions.get('window').width };
    const sizeForProxy = forceDimensions?.width || maxDimensions?.width || 4000;

    // Use the new preloading hook
    const imageCache = useImagePreload({
        url,
        priority,
        reqWidth: sizeForProxy,
        forceProxy,
        blurhash
    });

    // Fallback for dimensions
    const renderDimensions = forceDimensions;
    let finalDimensions = useMemo(() => {
        if (dimensions && !renderDimensions) {
            return calcDimensions(dimensions, maxDimensions!);
        }
        return renderDimensions || maxDimensions;
    }, []);

    console.log('<Image> source', imageCache, url)

    return (
        <Pressable
            style={[styles.pressable, style]}
            onPress={onPress ?? (() => {})}
            onLongPress={onLongPress ?? (() => {})}
            className={className}
            {...props}
        >
            <Image
                source={imageCache}
                placeholderContentFit={contentFit}
                cachePolicy="memory-disk"
                contentFit={contentFit}
                recyclingKey={url}
                onLoad={(_e) => {
                    if (onLoad) onLoad();
                }}
                style={{
                    width: safeFloor(finalDimensions?.width),
                    height: safeFloor(finalDimensions?.height),
                }}
            />
            <Text style={{ position: 'absolute', backgroundColor: 'red', fontSize: 18, opacity: 0.5 }}>
                {maxDimensions?.width}
                { imageCache?.blurhash?.toString()}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
