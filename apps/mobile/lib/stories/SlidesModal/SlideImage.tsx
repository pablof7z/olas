import { NDKImetaTag } from '@nostr-dev-kit/ndk-mobile';
import { Image, ImageStyle, useImage } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { isLoadingAtom, durationAtom } from './store';
import { useSetAtom } from 'jotai';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

const isOverLandscapeThreshold = (width: number, height: number) => {
    return width / height > 1.1;
};

export function SlideImage({ imeta }: { imeta: NDKImetaTag }) {
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);
    const [isLandscape, setIsLandscape] = useState(false);

    const imageSource = useImage(
        {
            uri: imeta.url,
            blurhash: imeta.blurhash,
        },
        {
            onError: (error) => {
                console.log('error', error);
            },
        }
    );

    useEffect(() => {
        if (!imageSource?.width || !imageSource?.height) return;

        if (!isLandscape && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
            setIsLandscape(true);
        } else if (isLandscape && !isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
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
                setIsLoading(true);
            }}
            onDisplay={() => {
                setIsLoading(false);
                setDuration(8000);
                if (imageSource?.width && imageSource?.height && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
                    setIsLandscape(true);
                }
            }}
            onLoad={() => {}}
            onLoadEnd={() => {}}
        />
    );
}
