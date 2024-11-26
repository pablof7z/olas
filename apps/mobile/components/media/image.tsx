import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { Image, useImage } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
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
    const pUri = getProxiedImageUrl(url.url); 
    const image = useImage({
        uri: pUri,
        blurhash: url.blurhash,
    },);

    try {
        // expo-image seems to throw every once in a while for some reason -- this should catch the error
        image?.width;
    } catch (e) {
        console.log('error', e);
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', height: maxWidth, width: maxWidth }}>
                <ActivityIndicator />
            </View>
        )
    }
    
    const width = image?.width;
    const height = image?.height;

    return (
        <Pressable onPress={onPress}>
            <Image
                {...props}
                source={image}
                contentFit="fill"
                style={[
                    {
                        width: maxWidth,
                        height: height ? height / (width / maxWidth) : undefined,
                        backgroundColor: colors.background,
                    },
                ]}
            />
        </Pressable>
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
