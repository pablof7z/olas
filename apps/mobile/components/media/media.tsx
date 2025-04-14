import type { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { useMemo } from 'react';
import { Dimensions, type StyleProp, type ViewStyle } from 'react-native';

import ImageComponent from './image';
import VideoComponent from './video';

import { urlIsVideo } from '@/utils/media';

export default function MediaComponent({
    imeta,
    className,
    forceProxy,
    maxWidth,
    maxHeight,
    priority,
    onPress,
    width,
    contentFit,
    height,
    onLongPress,
    muted,
    style,
    autoplay,
    ...props
}: {
    imeta: NDKImetaTag;
    maxWidth?: number;
    maxHeight?: number;
    priority?: 'low' | 'normal' | 'high';
    onPress?: () => void;
    forceProxy?: boolean;
    onLongPress?: () => void;
    width?: number;
    height?: number;
    contentFit?: 'contain' | 'cover';
    muted?: boolean;
    className?: string;
    style?: StyleProp<ViewStyle>;
    autoplay?: boolean;
}) {
    const forceDimensions = width && height ? { width, height } : undefined;
    const { url, blurhash, dim, dimensions } = useMemo(() => {
        const { url, blurhash, dim } = imeta;
        const dimensions = dim?.split('x').map(Number) ?? undefined;
        const validDimensions =
            dimensions?.[0] && dimensions[1]
                ? { width: dimensions[0], height: dimensions[1] }
                : undefined;

        return {
            url,
            blurhash,
            dim,
            dimensions: validDimensions,
        };
    }, [imeta]);

    if (!url) return null;

    if (urlIsVideo(url)) {
        return (
            <VideoComponent
                url={url}
                forceDimensions={forceDimensions}
                dimensions={dimensions}
                maxDimensions={{ width: maxWidth, height: maxHeight }}
                onPress={onPress}
                onLongPress={onLongPress}
                muted={muted}
                autoplay={autoplay}
                {...props}
            />
        );
    }

    return (
        <ImageComponent
            url={url}
            blurhash={blurhash}
            dimensions={dimensions}
            maxDimensions={{ width: maxWidth, height: maxHeight }}
            priority={priority}
            forceDimensions={forceDimensions}
            forceProxy={forceProxy}
            onPress={onPress}
            contentFit={contentFit}
            onLongPress={onLongPress}
            className={className}
            style={style}
            {...props}
        />
    );
}
