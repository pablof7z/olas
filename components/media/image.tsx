import { Image, useImage } from 'expo-image';
import { Clock } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    type GestureResponderEvent,
    Linking,
    Pressable,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';

import type { MediaDimensions } from './types';

import useImageLoader from '@/lib/image-loader/hook';
import { FileWarning, RefreshCcw } from 'lucide-react-native';
import { ActivityIndicator } from '../nativewindui/ActivityIndicator';
import { Text } from '../nativewindui/Text';
import { useAppSettingsStore } from '@/stores/app';

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
    scaleToWidth,
    contentFit,
    onPress,
    onLongPress,
    className,
    style,
    ...props
}: {
    url: string;
    blurhash?: string;
    scaleToWidth?: number;
    dimensions?: MediaDimensions;
    priority?: 'low' | 'normal' | 'high' | 'highest';
    contentFit?: 'contain' | 'cover';
    maxDimensions?: Partial<MediaDimensions>;
    forceDimensions?: Partial<MediaDimensions>;
    forceProxy?: boolean;
    onPress: () => void;
    onLongPress: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    if (!maxDimensions) maxDimensions = { width: Dimensions.get('window').width };
    
    // Use the new preloading hook
    const image = useImage({uri: url, blurhash});
    // const image = useImageLoader(useImageLoaderQueue ? url : false, { blurhash, priority, reqWidth: scaleToWidth });

    // const imageSource = useMemo(() => {
    //     if (useImageLoaderQueue) {
    //         return { ...image.image, blurhash };
    //     } else {
    //         return { uri: url, blurhash };
    //     }
    // }, [useImageLoaderQueue, image.status, image.image, blurhash]);

    // Fallback for dimensions
    const renderDimensions = forceDimensions;
    const finalDimensions = useMemo(() => {
        if (forceDimensions) return forceDimensions;
        if (dimensions && !renderDimensions) {
            return calcDimensions(dimensions, maxDimensions!);
        }
        return renderDimensions || maxDimensions;
    }, []);

    return (
        <Pressable
            style={[styles.pressable, style, { position: 'relative' }]}
            className={className}
            onPress={onPress}
            onLongPress={onLongPress}
            {...props}
        >
            <Image
                source={image}
                placeholder={{ blurhash}}
                priority={priority}
                recyclingKey={url}
                allowDownscaling={true}
                style={{
                    width: safeFloor(finalDimensions?.width),
                    height: safeFloor(finalDimensions?.height),
                    flex: 1,
                }}
            />
            {/* {useImageLoaderQueue && image.status !== 'loaded' && (
                <View style={{ position: 'absolute', top: 10, left: 0 }}>
                    <ImageStatusIndicator status={image.status} onRetry={image.retry} />
                </View>
            )} */}
        </Pressable>
    );
}

function ImageStatusIndicator({
    status,
    onRetry,
}: {
    status: 'unknown' | 'queued' | 'loading' | 'loaded' | 'error';
    onRetry: () => void;
}) {
    if (status === 'loading') {
        return <ActivityIndicator size="small" color="black" style={{ opacity: 0.2 }} />;
    }
    if (status === 'queued') {
        return <Clock color="black" style={{ opacity: 0.2 }} />;
    }
    if (status === 'error') {
        return (
            <Pressable onPress={onRetry}>
                <FileWarning color="black" />
            </Pressable>
        );
    }
    // No indicator for 'idle' or 'loaded'
    return null;
}

const styles = StyleSheet.create({
    pressable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
