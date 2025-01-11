import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Image, ImageSource, useImage } from 'expo-image';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle, StyleSheet, Dimensions } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { type MediaDimensions } from "./types";
import { Text } from '../nativewindui/Text';

/**
 * This keeps a record of the known image heights for a given url.
 */
const knownImageDimensions: Record<string, MediaDimensions> = {};

export function calcDimensions(dimensions: MediaDimensions, maxDimensions: Partial<MediaDimensions>) {
    let { width, height } = dimensions;
    const { width: maxWidth } = maxDimensions;


    if (maxWidth && width > maxWidth) {
        width = maxWidth;
        height = Math.floor(height / (width / maxWidth));
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
    let renderDimensions = knownImageDimensions[url];
    
    // if we know the image dimensions but not the render, calculate
    if (dimensions && !renderDimensions) {
        dimensions = calcDimensions(dimensions, maxDimensions);
    }

    const _style = useMemo(() => {
        let width = renderDimensions?.width ?? maxDimensions?.width;
        let height = renderDimensions?.height ?? maxDimensions?.height;
        return { width, height };
    }, [renderDimensions?.width, renderDimensions?.height, maxDimensions?.width, maxDimensions?.height, url])

    const cacheKey = useMemo(
        () => [url, maxDimensions?.width??"", maxDimensions?.height??""].join('-'),
        [url, maxDimensions?.width, maxDimensions?.height]
    );
    const imageSource = useImage({
        blurhash,
        uri: pUri,
        width: dimensions?.width,
        height: dimensions?.height,
        cacheKey
    })

    return (
        <Pressable
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={onPress}
            onLongPress={onLongPress}
            className={className}
            {...props}
        >
            <Image
                placeholder={{blurhash}}
                placeholderContentFit="cover"
                priority={priority}
                source={imageSource}
                contentFit="cover"
                recyclingKey={url}
                onLoadEnd={() => {
                    if (!imageSource) return;
                    const { width, height} = imageSource;
                    knownImageDimensions[url] = { width, height }
                }}
                style={{ width: _style.width, height: _style.height }}
            />
        </Pressable>
    );
}
