import { imetasFromEvent } from '@/ndk-expo/utils/imeta';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { Image } from 'expo-image';
import { Dimensions, ImageProps, View } from 'react-native';

const getUrls = (event: NDKEvent): { url?: string, blurhash?: string }[] => {
    if (event.kind === NDKKind.Text) {
        const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
        if (!urls?.length) return [];
        return urls.map(url => ({ url }));
    } else if (event.kind === 20) {
        const imetas = imetasFromEvent(event);
        if (imetas.length === 0) {
            console.log('no imeta', event.tags);
            const url = event.tagValue('url');
            const blurhash = event.tagValue('blurhash');
            return [{ url, blurhash }];
        }
        console.log('imetas', JSON.stringify(imetas, null, 2));

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
    const urls = getUrls(event);
    if (!urls.length) return null;

    const proxiedUrl = getProxiedImageUrl(urls[0].url);
    console.log('proxiedUrl', proxiedUrl);
    // const image = useImage({ uri: proxiedUrl });

    const windowWidth = Dimensions.get('screen')?.width;
    // if (!image?.width || !image?.height || !windowWidth) return null;

    return (
        <View className="bg-secondary flex-1">
        <Image
            {...props}
            source={{ uri: proxiedUrl }}
            style={{
                width: windowWidth,
                // height: (windowWidth / image.width) * image.height,
                ...(typeof props.style === 'object' ? props.style : {}),
            }}
            placeholder={urls[0].blurhash ? { blurhash: urls[0].blurhash } : undefined}
            />
        </View>
    );
}
