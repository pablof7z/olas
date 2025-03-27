import type { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { Image, type ImageStyle, useImage } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

// Default duration for images (in milliseconds)
const DEFAULT_DURATION = 8000;

const isOverLandscapeThreshold = (width: number, height: number) => {
    return width / height > 1.1;
};

interface SlideImageProps {
    imeta: NDKImetaTag;
    onContentLoaded: (duration: number) => void;
}

export function SlideImage({ imeta, onContentLoaded }: SlideImageProps) {
    const [isLandscape, setIsLandscape] = useState(false);

    const imageSource = useImage(
        {
            uri: imeta.url,
            blurhash: imeta.blurhash,
        },
        {
            onError: (_error) => {},
        }
    );

    useEffect(() => {
        if (!imageSource?.width || !imageSource?.height) return;

        if (!isLandscape && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
            setIsLandscape(true);
        } else if (
            isLandscape &&
            !isOverLandscapeThreshold(imageSource?.width, imageSource?.height)
        ) {
            setIsLandscape(false);
        }
    }, [isLandscape, imageSource?.width, imageSource?.height]);

    const style = useMemo(() => {
        const style: ImageStyle = {};

        style.width = screenWidth;
        style.height = screenHeight;

        return style;
    }, [imageSource?.width, imageSource?.height, isLandscape]);

    return (
        <Image
            contentFit="cover"
            source={imageSource}
            style={style}
            onLoadStart={() => {
                // Loading starts
            }}
            onDisplay={() => {
                onContentLoaded(DEFAULT_DURATION);
                if (
                    imageSource?.width &&
                    imageSource?.height &&
                    isOverLandscapeThreshold(imageSource?.width, imageSource?.height)
                ) {
                    setIsLandscape(true);
                }
            }}
            onLoad={() => {}}
            onLoadEnd={() => {}}
        />
    );
}
