import { imetaFromEvent } from '@/ndk-expo/utils/imeta';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { Image } from 'expo-image';
import { Dimensions, ImageProps, View } from 'react-native';

const getUrl = (event: NDKEvent) => {
    if (event.kind === NDKKind.Text) {
        const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
        if (!urls?.length) return {};
        return { url: urls[0] };
    } else if (event.kind === 20) {
        const imeta = imetaFromEvent(event);
        const url = imeta.url ?? event.tagValue('url');
        if (!url) return {};
        return { url, blurhash: imeta.blurhash };
    } else {
        throw new Error(`Unsupported event kind: ${event.kind}`);
    }

    return {};
};

export default function ImageComponent({ event, ...props }: { event: NDKEvent } & ImageProps) {
    const { url, blurhash } = getUrl(event);
    if (!url) return null;

    const proxiedUrl = getProxiedImageUrl(url);
    // const image = useImage({ uri: proxiedUrl });

    const windowWidth = Dimensions.get('screen')?.width;
    // if (!image?.width || !image?.height || !windowWidth) return null;

    return (
        <View className="bg-red-500 flex-1">
        <Image
            {...props}
            source={{ uri: proxiedUrl }}
            style={{
                width: windowWidth,
                // height: (windowWidth / image.width) * image.height,
                ...(typeof props.style === 'object' ? props.style : {}),
            }}
            placeholder={blurhash ? { blurhash } : undefined}
            />
        </View>
    );
}
