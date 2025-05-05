import { Image, useImage } from 'expo-image';
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
    const imageCache = useImageLoader(url, {
        reqWidth: sizeForProxy,
        forceProxy,
        blurhash,
    });

    // Fallback for dimensions
    const renderDimensions = forceDimensions;
    const finalDimensions = useMemo(() => {
        if (forceDimensions) return forceDimensions;
        if (dimensions && !renderDimensions) {
            return calcDimensions(dimensions, maxDimensions!);
        }
        return renderDimensions || maxDimensions;
    }, []);

    const [retrying, setRetrying] = useState(false);

    const retry = useCallback(async (event: GestureResponderEvent) => {
        alert('retrying');
        setRetrying(true);
        // await imageCache.retry()
        setRetrying(false);
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
                source={imageCache.image}
                allowDownscaling={false}
                onLoad={(_e) => {
                    if (onLoad) onLoad();
                }}
                style={{
                    width: safeFloor(finalDimensions?.width),
                    height: safeFloor(finalDimensions?.height),
                    flex: 1,
                }}
            />
            <View style={{ position: 'absolute', top: 10, right: 10 }}>
                {imageCache.status === 'error' && (
                    <Pressable onPress={retry}>
                        <FileWarning color="black" />
                    </Pressable>
                )}
            </View>
            {/* {retrying ? (
                <ActivityIndicator size="small" />
            ) : (imageCache.status === 'error' && (
                <Pressable  style={{ position: 'absolute', top: 2, right: 2 }} onPress={retry}>
                    <RefreshCcw />
                </Pressable>
            ))}
            <Text style={{ backgroundColor: 'red', fontSize: 12, opacity: 0.9 }}>
                {sizeForProxy}{' '}
                {finalDimensions?.width}x{finalDimensions?.height}
                { url }{' '}
                { imageCache.status }
            </Text> */}
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
