import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { Dimensions, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { imetasFromEvent } from '@/utils/imeta';
import React, { memo, useMemo } from 'react';

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
    windowWidth,
    onPress,
    colors,
    props,
}: {
    url: { url?: string; blurhash?: string };
    windowWidth: number;
    onPress: () => void;
    colors: any;
    props: any;
}) {
    return (
        <View style={{ position: 'relative', flex: 1 }}>
            {url.blurhash && (
                <Image
                    source={undefined}
                    placeholder={{ blurhash: url.blurhash }}
                    contentFit="cover"
                    style={{
                        position: 'absolute',
                        width: windowWidth,
                        height: '100%',
                    }}
                />
            )}
            <Pressable onPress={onPress}>
                <Image
                    {...props}
                    source={{ uri: getProxiedImageUrl(url.url) }}
                    contentFit="contain"
                    style={[
                        {
                            width: windowWidth,
                            backgroundColor: colors.background,
                        },
                        props.style || {},
                    ]}
                    placeholder={url.blurhash ? { blurhash: url.blurhash } : undefined}
                />
            </Pressable>
        </View>
    );
});

export default memo(function ImageComponent({
    event,
    onPress,
    ...props
}: {
    event: NDKEvent;
    onPress: () => void;
} & Partial<Image>) {
    const { colors } = useColorScheme();
    const urls = useMemo(() => getUrls(event), [event]);
    const { width: windowWidth } = useWindowDimensions();

    if (urls.length === 0) return null;

    if (urls.length === 1) {
        return <SingleImage url={urls[0]} windowWidth={windowWidth} onPress={onPress} colors={colors} props={props} />;
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            minimumZoomScale={1}
            maximumZoomScale={5}
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ flex: 1, width: '100%' }}>
            {urls.map((url, index) => (
                <SingleImage key={index} url={url} windowWidth={windowWidth} onPress={onPress} colors={colors} props={props} />
            ))}
        </ScrollView>
    );
});
