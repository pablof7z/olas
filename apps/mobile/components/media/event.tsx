import { imetasFromEvent } from '@/utils/imeta';
import { NDKEvent, NDKKind, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, ScrollView, StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import MediaComponent from './media';

export type EventMediaProps = {
    event: NDKEvent;
    width?: number;
    className?: string;
    singleMode?: boolean;
    style?: StyleProp<ViewStyle>;
    maxWidth?: number;
    maxHeight?: number;
    onPress?: () => void;
};

export function EventMediaGridContainer({
    event,
    index,
    onPress,
    size,
    ...props
}: { event: NDKEvent; index: number; onPress: () => void; size?: number } & Partial<View>) {
    size ??= Dimensions.get('window').width / 3;

    return (
        <EventMediaContainer
            event={event}
            onPress={onPress}
            className="flex-1 flex-col items-stretch justify-stretch"
            style={{
                marginHorizontal: index % 3 === 1 ? 1 : 0,
                marginBottom: 1,
                overflow: 'hidden',
            }}
            singleMode
            maxHeight={size}
            maxWidth={index % 3 === 1 ? size - 1 : size}
            {...props}
        />
    );
}

export default function EventMediaContainer({
    event,
    width,
    className,
    singleMode,
    maxWidth,
    maxHeight,
    onPress,
    style,
    ...props
}: EventMediaProps) {
    const { colors } = useColorScheme();
    const urls = getUrls(event);

    maxWidth ??= Dimensions.get('window').width;

    if (urls.length === 0) {
        console.log('no urls');
        return null;
    }

    if (singleMode || urls.length === 1) {
        return (
            <MediaComponent
                url={urls[0].url}
                blurhash={urls[0].blurhash}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                onPress={onPress}
                className={className}
                style={style}
                {...props}
            />
        );
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
                    <MediaComponent
                        key={index}
                        url={url.url}
                        blurhash={url.blurhash}
                        maxWidth={maxWidth}
                        maxHeight={maxHeight}
                        onPress={onPress}
                        className={className}
                        style={style}
                    />
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

    // if (isVideo) {
    //     return <Video
    // } else {
    //     return <Image
    // }
}

const VIDEO_KINDS = new Set([NDKKind.HorizontalVideo, NDKKind.VerticalVideo]);

export function isEventVideo(event: NDKEvent) {
    if (VIDEO_KINDS.has(event.kind)) return true;
    if (event.kind === NDKKind.Image) return false;
}

export const getUrls = (event: NDKEvent): { url?: string; blurhash?: string }[] => {
    try {
        if (event.kind === NDKKind.Text) {
            const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/gi);
            if (urls?.length) return urls.map((url) => ({ url }));
        }

        if (event.kind === NDKKind.Image) {
            const imetas = imetasFromEvent(event);
            if (imetas.length > 0) {
                return imetas.map((imeta) => ({ url: imeta.url, blurhash: imeta.blurhash }));
            }
        }

        if (event.kind === NDKKind.VerticalVideo || event.kind === NDKKind.HorizontalVideo) {
            const url = event.tagValue('url');
            if (url) return [{ url }];
        }

        // didn't find anything, try a last-ditch url tag
        const urls = event.getMatchingTags('url').map((t) => ({ url: t[1] }));
        if (urls.length > 0) return urls;

        const imetas = imetasFromEvent(event);
        if (imetas.length > 0) {
            return imetas.map((imeta) => ({ url: imeta.url, blurhash: imeta.blurhash }));
        }

        return [];
    } catch (e) {
        console.warn('Error parsing image URLs:', e);
        return [];
    }
};
