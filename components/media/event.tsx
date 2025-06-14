import {
    type NDKEvent,
    NDKImage,
    type NDKImetaTag,
    NDKKind,
    NDKVideo,
    mapImetaTag,
} from '@nostr-dev-kit/ndk';
import {
    Dimensions,
    ScrollView,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';

import ProductGridContainer from '../product/grid-container';
import MediaComponent from './media';

import { useColorScheme } from '@/lib/useColorScheme';
import EventMedia3ItemsContainer from './event-3-items';
import EventMedia4ItemsContainer from './event-4-items';

export type EventMediaProps = {
    event: NDKEvent;
    muted?: boolean;
    width?: number;
    height?: number;
    singleMode?: boolean;
    forceProxy?: boolean;
    scaleToWidth?: number;
    contentFit?: 'contain' | 'cover';
    style?: StyleProp<ViewStyle>;
    priority?: 'low' | 'normal' | 'high' | 'highest';
    maxWidth?: number;
    maxHeight?: number;
    onPress?: () => void;
    onLongPress?: () => void;
    autoplay?: boolean;
    forceScroll?: boolean;
};

export type EventMediaGridContainerProps = {
    event: NDKEvent;
    index: number;
    forceProxy?: boolean;
    onPress: () => void;
    onLongPress?: () => void;
    size?: number;
    numColumns: number;
    style?: StyleProp<ViewStyle>;
} & Partial<View>;

export function EventMediaGridContainer({
    event,
    index,
    onPress,
    forceProxy,
    onLongPress,
    numColumns = 3,
    size,
    style,
    ...props
}: EventMediaGridContainerProps) {
    size ??= Dimensions.get('window').width / numColumns;

    if (event.kind === 30402) {
        return (
            <ProductGridContainer event={event}>
                <EventMediaContainer
                    event={event}
                    onPress={onPress}
                    forceProxy={forceProxy}
                    onLongPress={onLongPress}
                    style={[styles.mediaGridContainer, style]}
                    singleMode
                    width={size}
                    height={size}
                    {...props}
                />
            </ProductGridContainer>
        );
    }

    return (
        <View
            style={[styles.mediaGridContainer, index % numColumns !== 0 ? { marginLeft: 0.5 } : {}]}
        >
            <EventMediaContainer
                event={event}
                onPress={onPress}
                forceProxy={forceProxy}
                onLongPress={onLongPress}
                singleMode
                scaleToWidth={size}
                width={size}
                height={size}
                autoplay={false}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    mediaGridContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 0.5,
    },
});

export default function EventMediaContainer({
    event,
    width,
    autoplay,
    muted,
    singleMode,
    height,
    forceProxy,
    maxWidth,
    contentFit,
    maxHeight,
    scaleToWidth,
    priority,
    onPress,
    onLongPress,
    style,
    forceScroll = true,
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
                forceProxy
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                scaleToWidth={scaleToWidth}
                priority={priority}
                onPress={onPress}
                muted={muted}
                onLongPress={onLongPress}
                style={style}
                autoplay={autoplay}
                {...props}
            />
        );
    }

    // Grid layout for 3 or 4 images when forceScroll is false
    if (!forceScroll && (imetas.length === 3 || imetas.length === 4)) {
        maxHeight ??= maxWidth;
        if (imetas.length === 3) {
            return (
                <EventMedia3ItemsContainer
                    imetas={imetas}
                    maxWidth={maxWidth}
                    maxHeight={maxHeight}
                    onPress={onPress}
                    width={0}
                    height={0}
                />
            );
        } else if (imetas.length === 4) {
            // 4-image grid: 2x2
            return (
                <EventMedia4ItemsContainer
                    imetas={imetas}
                    maxWidth={maxWidth}
                    maxHeight={maxHeight}
                    onPress={onPress}
                />
            );
        }
    }

    // Default: scroll view for multiple images
    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                minimumZoomScale={1}
                maximumZoomScale={5}
                contentContainerStyle={{ flexGrow: 1 }}
                style={{ flex: 1, width: '100%' }}
            >
                {imetas.map((imeta, index) => (
                    <MediaComponent
                        key={index}
                        imeta={imeta}
                        maxWidth={maxWidth}
                        maxHeight={maxHeight}
                        scaleToWidth={scaleToWidth}
                        onPress={onPress}
                        priority={priority}
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

const VIDEO_KINDS = new Set([
    NDKKind.HorizontalVideo,
    NDKKind.VerticalVideo,
    NDKKind.ShortVideo,
    NDKKind.Video,
]);

export function isEventVideo(event: NDKEvent) {
    if (VIDEO_KINDS.has(event.kind)) return true;
    if (event.kind === NDKKind.Image) return false;
}

export const getImetas = (event: NDKEvent): NDKImetaTag[] => {
    if (event.kind === 30018) {
        try {
            const parsed = JSON.parse(event.content);
            const imetas = parsed.images.map((image: string) => ({ url: image }));
            return imetas;
        } catch {
            return [];
        }
        // const imetas = event.getMatchingTags("images")
    } else if (event.kind === 30402) {
        const imaages = event.getMatchingTags('image').map((t) => ({ url: t[1] }));
        return imaages;
    }

    if (event instanceof NDKImage || event instanceof NDKVideo) {
        return event.imetas;
    }

    const imetas = event.getMatchingTags('imeta').map(mapImetaTag);
    if (imetas.length > 0) return imetas;

    try {
        if (event.kind === NDKKind.Text) {
            const urls = event.content.match(
                /https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv)/gi
            );
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
