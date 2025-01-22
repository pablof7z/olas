import { urlIsVideo } from '@/utils/media';
import ImageComponent from './image';
import VideoComponent from './video';
import { StyleProp, ViewStyle } from 'react-native';
import { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { useMemo } from 'react';

export default function MediaComponent({
    imeta,
    className,
    maxWidth,
    maxHeight,
    priority,
    onPress,
    onLongPress,
    muted,
    style,
    ...props
}: {
    imeta: NDKImetaTag;
    maxWidth?: number;
    maxHeight?: number;
    priority?: 'low' | 'normal' | 'high',
    onPress?: () => void;
    onLongPress?: () => void;
    muted?: boolean;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const {
        url,
        blurhash,
        dim,
        dimensions,
    } = useMemo(() => {
        return {
            url: imeta.url,
            blurhash: imeta.blurhash,
            dim: imeta.dim,
            dimensions: dim?.split('x').map(Number) ?? undefined,
        }
    }, [imeta]);

    if (urlIsVideo(url)) {
        return (
            <VideoComponent
                url={url}
                dimensions={dimensions}
                maxDimensions={{ width: maxWidth, height: maxHeight }}
                onPress={onPress}
                onLongPress={onLongPress}
                muted={muted}
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
            onPress={onPress}
            onLongPress={onLongPress}
            className={className}
            style={style}
            {...props}
        />
    );
}
