import { mapImetaTag, NDKEvent, NDKImage, NDKImetaTag, NDKKind, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import MediaComponent from './media';
import ProductGridContainer from '../product/grid-container';

export type EventMediaProps = {
    event: NDKEvent;
    muted?: boolean;
    width?: number;
    height?: number;
    className?: string;
    singleMode?: boolean;
    forceProxy?: boolean;
    contentFit?: 'contain' | 'cover';
    style?: StyleProp<ViewStyle>;
    priority?: 'low' | 'normal' | 'high',
    maxWidth?: number;
    maxHeight?: number;
    onPress?: () => void;
    onLongPress?: () => void;
};

export type EventMediaGridContainerProps = {
    event: NDKEvent;
    index: number;
    forceProxy?: boolean;
    onPress: () => void;
    onLongPress: () => void;
    size?: number;
} & Partial<View>;

export function EventMediaGridContainer({
    event,
    index,
    onPress,
    forceProxy,
    onLongPress,
    size,
    ...props
}: EventMediaGridContainerProps) {
    size ??= Dimensions.get('window').width / 3;

    if (event.kind === 30402) {
        return <ProductGridContainer event={event}>
            <EventMediaContainer
                event={event}
                onPress={onPress}
                forceProxy={forceProxy}
                onLongPress={onLongPress}
                style={[styles.mediaGridContainer, {
                    marginHorizontal: index % 3 === 1 ? 1 : 0,
                }]}
                singleMode
                width={size}
                height={size}
                {...props}
            />
        </ProductGridContainer>
    }

    return (
        <EventMediaContainer
            event={event}
            onPress={onPress}
            forceProxy={forceProxy}
            onLongPress={onLongPress}
            style={[styles.mediaGridContainer, {
                marginHorizontal: index % 3 === 1 ? 1 : 0,
            }]}
            singleMode
            width={size}
            height={size}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    mediaGridContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 1,
    }
});

export default function EventMediaContainer({
    event,
    width,
    className,
    muted,
    singleMode,
    height,
    forceProxy,
    maxWidth,
    contentFit,
    maxHeight,
    priority,
    onPress,
    onLongPress,
    style,
    ...props
}: EventMediaProps) {
    const { colors } = useColorScheme();
    const imetas = getImetas(event);

    maxWidth ??= Dimensions.get('window').width;

    if (imetas.length === 0) {
        return null;
    }

    if (singleMode || imetas.length === 1) {
        return (
            <MediaComponent
                imeta={imetas[0]}
                width={width}
                height={height}
                contentFit={contentFit}
                forceProxy={true}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                priority={priority}
                onPress={onPress}
                muted={muted}
                onLongPress={onLongPress}
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
                {imetas.map((imeta, index) => (
                    <MediaComponent
                        key={index}
                        imeta={imeta}
                        maxWidth={maxWidth}
                        maxHeight={maxHeight}
                        onPress={onPress}
                        priority={priority}
                        className={className}
                        style={style}
                    />
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, padding: 8 }}>
                {imetas.map((_, index) => (
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

export const getImetas = (event: NDKEvent): NDKImetaTag[] => {
    if (event.kind === 30018) {
        try {
            const parsed = JSON.parse(event.content);
            console.log('getImetas', JSON.stringify(parsed, null, 2));
            const imetas = parsed.images.map((image: string) => ({ url: image }));
            return imetas;
        } catch { return []; }
        // const imetas = event.getMatchingTags("images")
    } else if (event.kind === 30402) {
        const imaages = event.getMatchingTags("image").map((t) => ({ url: t[1] }));
        return imaages;
    }
    
    if (event instanceof NDKImage || event instanceof NDKVideo) {
        return event.imetas;
    }

    const imetas = event.getMatchingTags("imeta")
        .map(mapImetaTag)
    if (imetas.length > 0) return imetas;
    
    try {
        if (event.kind === NDKKind.Text) {
            const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv)/gi);
            if (urls?.length) return urls.map((url) => ({ url }));
        }

        if (event.kind === NDKKind.Image) {
            const asImage = NDKImage.from(event);
            return asImage.imetas;
        }

        if (event.kind === NDKKind.VerticalVideo || event.kind === NDKKind.HorizontalVideo) {
            const url = event.tagValue('url');
            if (url) return [{ url, type: 'video' }];
        }

        // didn't find anything, try a last-ditch url tag
        const urls = event.getMatchingTags('url').map((t) => ({ url: t[1] }));
        if (urls.length > 0) return urls;

        return [];
    } catch (e) {
        console.warn('Error parsing image URLs:', e);
        return [];
    }
};
