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

    width = maxWidth;
    height = Math.round(maxWidth / aspectRatio);

    // Adjust height if it exceeds maxHeight
    if (maxHeight && height > maxHeight) {
        height = maxHeight;
    }

    return { width, height };
}

export default function ImageComponent({
    url,
    blurhash,
    dimensions,
    maxDimensions,
    priority,
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
    maxDimensions?: Partial<MediaDimensions>;
    onPress: () => void;
    onLongPress: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const useImgProxy = !dimensions || (dimensions?.width > 4000 || dimensions?.height > 4000);
    if (!maxDimensions) maxDimensions = { width: Dimensions.get('window').width };

    const pUri = useImgProxy ? getProxiedImageUrl(url, maxDimensions?.width) : url;
    const renderDimensions = knownImageDimensions[url];

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
        () => [url, maxDimensions?.width??"", maxDimensions?.height??""].join('-'),
        [url, maxDimensions?.width, maxDimensions?.height]
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
                placeholderContentFit="cover"
                priority={priority}
                source={imageSource}
                contentFit="cover"
                recyclingKey={url}
                // onLoadStart={() => {
                //     console.log('onLoadStart', cacheKey)
                // }}
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
                    height: finalDimensions?.height
                }}
            />
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