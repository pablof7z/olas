import { imetasFromEvent } from '@/ndk-expo/utils/imeta';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { Image } from 'expo-image';
import { Dimensions, ImageProps, ScrollView, View } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';

const getUrls = (event: NDKEvent): { url?: string, blurhash?: string }[] => {
    if (event.kind === NDKKind.Text) {
        const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
        if (!urls?.length) return [];
        return urls.map(url => ({ url }));
    } else if (event.kind === 20) {
        const imetas = imetasFromEvent(event);
        if (imetas.length === 0) {
            const url = event.tagValue('url');
            const blurhash = event.tagValue('blurhash');
            return [{ url, blurhash }];
        }

        return imetas.map(imeta => ({ url: imeta.url, blurhash: imeta.blurhash }));
    } else if (event.kind === NDKKind.VerticalVideo || event.kind === NDKKind.HorizontalVideo) {
        const url = event.tagValue('thumb');
        if (!url) return [];
        return [{ url }];
    } else {
        throw new Error(`Unsupported event kind: ${event.kind}`);
    }

    return [];
};

export default function ImageComponent({ event, ...props }: { event: NDKEvent } & ImageProps) {
    const { colors } = useColorScheme();
    const urls = getUrls(event);
    if (!urls.length) return null;

    const proxiedUrl = getProxiedImageUrl(urls[0].url);
    const windowWidth = Dimensions.get('screen')?.width;

    return (
        <ScrollView minimumZoomScale={1} maximumZoomScale={5} className="flex-1">
            <View style={{ position: 'relative' }}>
                {urls[0].blurhash && (
                    <Image
                        source={undefined}
                        placeholder={{ blurhash: urls[0].blurhash }}
                        contentFit="cover"
                        style={{
                            position: 'absolute',
                            width: windowWidth,
                            height: '100%',
                        }}
                    />
                )}
                <Image
                    {...props}
                    source={{ uri: proxiedUrl }}
                    contentFit="contain"
                    style={{
                        width: windowWidth,
                        backgroundColor: colors.background,
                        ...(typeof props.style === 'object' ? props.style : {}),
                    }}
                    placeholder={urls[0].blurhash ? { blurhash: urls[0].blurhash } : undefined}
                />
            </View>
        </ScrollView>
    );
}
