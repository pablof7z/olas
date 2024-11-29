import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { Image, useImage } from 'expo-image';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { imetasFromEvent } from '@/utils/imeta';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text } from '../nativewindui/Text';

// Extract URLs from the event
const getUrls = (event: NDKEvent): { url?: string; blurhash?: string }[] => {
    try {
        if (event.kind === NDKKind.Text) {
            const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/gi);
            return urls?.length ? urls.map((url) => ({ url })) : [];
        }

        if (event.kind === 20) {
            const imetas = imetasFromEvent(event);
            if (imetas.length > 0) {
                return imetas.map((imeta) => ({ url: imeta.url, blurhash: imeta.blurhash }));
            }
            const url = event.tagValue('url');
            const blurhash = event.tagValue('blurhash');
            return url ? [{ url, blurhash }] : [];
        }

        if (event.kind === NDKKind.VerticalVideo || event.kind === NDKKind.HorizontalVideo) {
            const url = event.tagValue('thumb');
            return url ? [{ url }] : [];
        }

        return [];
    } catch (e) {
        console.warn('Error parsing image URLs:', e);
        return [];
    }
};

const SingleImage = memo(function SingleImage({
    url,
    maxWidth,
    onPress,
    colors,
    props,
}: {
    url: { url?: string; blurhash?: string };
    maxWidth: number;
    onPress: () => void;
    colors: any;
    props: any;
}) {
    const [imageDimensions, setImageDimensions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const pUri = getProxiedImageUrl(url.url);
    useEffect(() => {
        const loadImage = async () => {
            try {
                const path = await Image.getCachePathAsync(pUri);
                if (path) {
                    const { width, height } = await Image.loadAsync(path);
                    setImageDimensions({ width, height });
                } else {
                    const { width, height } = await Image.loadAsync(pUri); // Load the image and get its dimensions
                    setImageDimensions({ width, height });
                }
            } catch (error) {
                console.error('Error loading image dimensions', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadImage();
    }, [pUri]);

    if (isLoading || !imageDimensions) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: maxWidth,
                    width: maxWidth,
                }}>
                <ActivityIndicator />
            </View>
        );
    }

    const width = imageDimensions?.width;
    const height = imageDimensions?.height;

    return (
        <View style={{ position: 'relative', flex: 1 }}>
            <Pressable onPress={onPress}>
                <Image
                    {...props}
                    source={{ uri: pUri }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    style={[
                        {
                            width: maxWidth,
                            height: height ? height / (width / maxWidth) : undefined,
                            backgroundColor: colors.background,
                        },
                    ]}
                    placeholder={url.blurhash ? { blurhash: url.blurhash } : undefined}
                />
            </Pressable>
        </View>
    );
});

export default memo(function ImageComponent({
    event,
    singleImageMode,
    maxWidth,
    onPress,
    ...props
}: {
    event: NDKEvent;
    singleImageMode?: boolean;
    maxWidth?: number;
    onPress: () => void;
} & Partial<Image>) {
    const { colors } = useColorScheme();
    const urls = useMemo(() => getUrls(event), [event]);
    let { width: windowWidth } = useWindowDimensions();

    maxWidth ??= windowWidth;

    if (urls.length === 0) return null;

    if (urls.length === 1 || singleImageMode) {
        return <SingleImage url={urls[0]} maxWidth={maxWidth} onPress={onPress} colors={colors} props={props} />;
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
                    <SingleImage key={index} url={url} maxWidth={maxWidth} onPress={onPress} colors={colors} props={props} />
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
});
