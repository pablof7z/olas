import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Image, ImageSource } from 'expo-image';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Text } from '../nativewindui/Text';

export default function ImageComponent({
    url,
    blurhash,
    maxWidth,
    maxHeight,
    onPress,
    className,
    style,
    ...props
}: {
    url: string;
    blurhash?: string;
    maxWidth: number;
    maxHeight?: number;
    onPress: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const [image, setImage] = useState<ImageSource | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const pUri = getProxiedImageUrl(url);

    style ??= {};

    useEffect(() => {
        let isValid = true;
        
        const loadImageFromUrl = async (imgUrl: string) => {
            const res = await Image.loadAsync({
                uri: imgUrl,
                cacheKey: url,
                blurhash: blurhash,
            }, {
                onError: (e) => {
                    if (!isValid) return;
                    console.error('Error loading image', imgUrl, e, {originalUrl: url});
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
                const cachePath = await Image.getCachePathAsync(url);
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
                console.error('Error loading image', error, pUri, {originalUrl: url});
                setError(error.message);
            }
        };

        loadImage();

        return () => {
            isValid = false;
        };
    }, [url]); 

    if (isLoading || !imageDimensions || error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: maxHeight/2, position: 'relative', ...{style} }}>
                <Image
                    source={{ blurhash: blurhash }}
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
        <Pressable onPress={onPress} style={{ position: 'relative', flex: 1, ...style }} className={className} {...props}>
            <Image
                source={image}
                contentFit='cover'
                style={[
                    {
                        width: maxWidth,
                        height: maxHeight || height ? Math.min(height / (width / maxWidth), maxHeight) : undefined,
                    },
                ]}
            />
        </Pressable>
    );
}
