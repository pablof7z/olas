import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Image, ImageSource, useImage } from 'expo-image';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle, StyleSheet, Dimensions } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type MediaDimensions } from "./types";
import { Text } from '../nativewindui/Text';

/**
 * This keeps a record of the known image heights for a given url.
 */
const knownImageDimensions: Record<string, MediaDimensions> = {};

export function calcDimensions(dimensions: MediaDimensions, maxDimensions: Partial<MediaDimensions>) {
    let { width, height } = dimensions;
    const { width: maxWidth, height: maxHeight } = maxDimensions;

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
    className,
    style,
    ...props
}: {
    url: string;
    blurhash?: string;
    dimensions?: MediaDimensions;
    priority?: 'low' | 'normal' | 'high',
    contentFit?: 'contain' | 'cover',
    maxDimensions?: Partial<MediaDimensions>;
    forceDimensions?: Partial<MediaDimensions>;
    forceProxy?: boolean;
    onPress: () => void;
    onLongPress: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const useImgProxy = !dimensions || (dimensions?.width > 4000 || dimensions?.height > 4000) || forceProxy;
    if (!maxDimensions) maxDimensions = { width: Dimensions.get('window').width };

    const sizeForProxy = forceDimensions?.width || maxDimensions?.width;

    const pUri = useImgProxy ? getProxiedImageUrl(url, sizeForProxy) : url;
    const renderDimensions = forceDimensions || knownImageDimensions[url];

    // if we know the image dimensions but not the render, calculate
    if (dimensions && !renderDimensions) {
        dimensions = calcDimensions(dimensions, maxDimensions);
    }

    // Calculate dimensions only once
    const finalDimensions = useMemo(() => {
        if (dimensions && !renderDimensions) {
            return calcDimensions(dimensions, maxDimensions);
        }
        return renderDimensions || maxDimensions;
    }, [dimensions, renderDimensions, maxDimensions]);

    const cacheKey = useMemo(
        () => [url, sizeForProxy??""].join('-'),
        [url, sizeForProxy]
    );
    const imageSource = useImage({
        uri: pUri,
        cacheKey,
    })

    useEffect(() => {
        // Image.
    }, [cacheKey])

    const blurhashObj = { blurhash };

    return (
        <Pressable
            style={styles.pressable}
            onPress={onPress}
            onLongPress={onLongPress}
            className={className}
            {...props}
        >
            <Image
                placeholder={blurhashObj}
                placeholderContentFit={contentFit}
                priority={priority}
                source={imageSource}
                contentFit={contentFit}
                recyclingKey={url}
                // onLoadStart={() => {
                //     console.log('onLoadStart', cacheKey)
                // }}
                onError={(e) => {
                    console.log('Image loading error', cacheKey, e)
                }}
                onLoadEnd={() => {
                    // console.log('onLoadEnd', cacheKey)
                    try {
                        if (!imageSource) return;
                        const { width, height} = imageSource;
                        knownImageDimensions[url] = calcDimensions({ width, height }, maxDimensions);
                    } catch (e) {
                        console.error(e);
                    }
                }}
                style={{
                    width: finalDimensions?.width,
                    height: finalDimensions?.height,
                }}
            />
            {/* <Text className="text-red-500">{forceDimensions?.width}x{forceDimensions?.height}</Text>
            <Text className="text-red-500">{finalDimensions?.width}x{finalDimensions?.height}</Text>
            <Text className="text-red-500">{dimensions?.width}x{dimensions?.height}</Text>
            <Text className="text-red-500">{imageSource?.width}x{imageSource?.height}</Text>
            <Text className="text-red-500">{renderDimensions?.width}x{renderDimensions?.height}</Text>
            <Text className="text-red-500">{contentFit}</Text> */}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})