import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useImage, Image } from 'expo-image';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
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
    const image = useImage({ uri: getProxiedImageUrl(url.url) });

    const width = image?.width;
    const height = image?.height;
    return (
        <View style={{ position: 'relative', flex: 1 }}>
            <Pressable onPress={onPress}>
                <Image
                    {...props}
                    source={{ uri: getProxiedImageUrl(url.url) }}
                    contentFit="contain"
                    style={[
                        {
                            width: windowWidth,
                            height: height ? height / (width / windowWidth) : undefined,
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
                    <SingleImage key={index} url={url} windowWidth={windowWidth} onPress={onPress} colors={colors} props={props} />
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
                            opacity: 1
                        }}
                    />
                ))}
            </View>
        </View>
    );
});
