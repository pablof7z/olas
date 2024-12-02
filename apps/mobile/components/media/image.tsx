import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { Image, ImageContentFit, ImageRef, ImageSource, useImage } from 'expo-image';
import { ActivityIndicator, ImageStyle, Pressable, ScrollView, StyleProp, View, useWindowDimensions } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { imetasFromEvent } from '@/utils/imeta';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '../nativewindui/Text';
import { Button } from '../nativewindui/Button';

// Extract URLs from the event
const getUrls = (event: NDKEvent): { url?: string; blurhash?: string }[] => {
    try {
        if (event.kind === NDKKind.Text) {
            const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/gi);
            if (urls?.length) return urls.map((url) => ({ url }));
        }

        if (event.kind === 20) {
            const imetas = imetasFromEvent(event);
            if (imetas.length > 0) {
                return imetas.map((imeta) => ({ url: imeta.url, blurhash: imeta.blurhash }));
            }
        }

        if (event.kind === NDKKind.VerticalVideo || event.kind === NDKKind.HorizontalVideo) {
            const url = event.tagValue('thumb');
            if (url) return [{ url }];
        }

        // didn't find anything, try a last-ditch url tag
        return event.getMatchingTags('url').map(t => ({ url: t[1] }));
    } catch (e) {
        console.warn('Error parsing image URLs:', e);
        return [];
    }
};

const SingleImage = memo(function SingleImage({
    url,
    maxWidth,
    maxHeight,
    onPress,
}: {
    url: { url?: string; blurhash?: string };
    maxWidth: number;
    maxHeight: number;
    onPress: () => void;
}) {
    const [image, setImage] = useState<ImageSource | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const pUri = getProxiedImageUrl(url.url); 
    useEffect(() => {
        let isValid = true;
        const requestedUrl = url.url;
        
        const loadImageFromUrl = async (imgUrl: string) => {
            const res = await Image.loadAsync({
                uri: imgUrl,
                cacheKey: requestedUrl,
                blurhash: url.blurhash,
            }, {
                onError: (e) => {
                    if (!isValid) return;
                    console.error('Error loading image2', imgUrl, e, {originalUrl: url.url});
                    setError(e.message);
                },
            }); // Load the image and get its dimensions
            
            if (!isValid) {
                return;
            }
            setImage(res);
            setImageDimensions({ width: res.width, height: res.height });
        }
        
        const loadImage = async () => {
            try {
                const cachePath = await Image.getCachePathAsync(url.url);
                if (cachePath) {
                    await loadImageFromUrl(cachePath);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error getting cache path', error);
            }

            try {
                await loadImageFromUrl(pUri);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading image', error, pUri, {originalUrl: url.url});
                setError(error.message);
            }
        };

        loadImage();

        return () => {
            isValid = false;
        };
    }, [url.url]); 

    if (isLoading || !imageDimensions || error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: maxHeight/2, position: 'relative' }}>
                <Image
                    source={{ blurhash: url.blurhash }}
                    style={{ width: maxWidth, height: maxHeight/2 }}
                />
                {error ? (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Whoops, something's wrong with this image</Text>
                        <Text className="p-10 text-xs text-muted-foreground">{error}</Text>
                    </View>
                ) : (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator />
                    </View>
                )}
            </View>
        );
    }
    if (error) return <View style={{ flex: 1 }} />;

    const width = imageDimensions.width;
    const height = imageDimensions.height;
    return (
        <View style={{ position: 'relative', flex: 1 }}>
            <Pressable onPress={onPress}>
                <Image
                    source={image}
                    contentFit={ height && height > maxHeight ? 'cover' : 'contain' }
                    style={[
                        {
                            width: maxWidth,
                            height: height ? Math.min(height / (width / maxWidth), maxHeight) : undefined,
                        },
                    ]}
                />
            </Pressable>
        </View>
    );
});

export default function ImageComponent({
    event,
    singleImageMode,
    maxWidth,
    maxHeight,
    onPress,
    ...props
}: {
    event: NDKEvent;
    singleImageMode?: boolean;
    maxWidth?: number;
    maxHeight: number;
    onPress: () => void;
} & Partial<Image>) {
    const { colors } = useColorScheme();
    const urls = getUrls(event);
    let { width: windowWidth } = useWindowDimensions();

    maxWidth ??= windowWidth;

    if (urls.length === 0) {
        console.log('no urls', event.tags);
    }

    if (urls.length === 0) return (
        <View style={{ flex: 1, width: maxWidth, height: maxHeight }}>
            <Text>no images</Text>
        </View>
    );

    if (urls.length === 1 || singleImageMode) {
        return <SingleImage url={urls[0]} maxWidth={maxWidth} maxHeight={maxHeight} onPress={onPress} />;
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                minimumZoomScale={1}
                maximumZoomScale={5}
                contentContainerStyle={{ flexGrow: 1 }}
                style={{ flex: 1, width: '100%' }}>
                {urls.map((url, index) => (
                    <SingleImage key={index} url={url} maxWidth={maxWidth} maxHeight={maxHeight} onPress={onPress} />
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, padding: 8 }}>
                {urls.map((_, index) => (
                    <View
                        key={index}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 10,
                            backgroundColor: colors.primary,
                            opacity: 1,
                        }}
                    />
                ))}
            </View>
        </View>
    );
}