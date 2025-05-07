import { type NDKEvent, type NDKImetaTag, NDKKind, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AnimatePresence } from 'framer-motion';
import { MotiView } from 'moti';
import React, { useState, useCallback, useMemo } from 'react';
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    type TextStyle,
    View,
    type ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/buttons/back-button';
import useImageLoader from '@/lib/image-loader/hook';
import { useStoriesView } from '@/lib/stories/store';

const { width, height } = Dimensions.get('screen');
const IMAGE_WIDTH = width * 0.75;
const IMAGE_HEIGHT = height * 0.75;
const SPACING = 1;
const GRID_MARGIN = 0.5;
const windowWidth = width;

function getDayOfYear(ts: number) {
    const d = new Date(ts * 1000);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    return d.getFullYear() === new Date().getFullYear()
        ? Math.ceil(diff / (1000 * 3600 * 24))
        : undefined;
}

function EmptyDay() {
    return <View style={styles.emptyDay} />;
}

const dayItemText: TextStyle = {
    padding: 4,
    fontSize: 12,
    color: 'gray',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
};

function DayGrid({
    day,
    event,
    imeta,
    index,
    onPress,
}: {
    index: number;
    day: number;
    event: NDKEvent;
    imeta: NDKImetaTag;
    onPress: (e: NDKEvent) => void;
}) {
    const { image } = useImageLoader(imeta.url);
    const size = windowWidth / 3 - GRID_MARGIN * 2;
    return (
        <View
            style={[
                styles.gridItem,
                {
                    width: size,
                    height: size,
                    marginLeft: index % 3 === 0 ? 0 : GRID_MARGIN,
                    marginRight: index % 3 === 2 ? 0 : GRID_MARGIN,
                },
            ]}
        >
            {event ? (
                <Pressable style={{ flex: 1 }} onPress={() => onPress(event)}>
                    <Image source={image} style={{ flex: 1 }} />
                </Pressable>
            ) : (
                <EmptyDay />
            )}
            <Text style={dayItemText}>Day {day}</Text>
        </View>
    );
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const AnimatedBackground = React.memo(function AnimatedBackground({
    item,
    index,
    scrollX,
}: {
    item: { day: number; event: NDKEvent; imeta: NDKImetaTag };
    index: number;
    scrollX: { value: number };
}) {
    const bgStyle = useAnimatedStyle(() => {
        const pos = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const opacity = interpolate(
            pos,
            [index - 0.8, index, index + 0.8],
            [0, 0.4, 0],
            Extrapolation.CLAMP
        );
        return { opacity };
    });
    const textStyle = useAnimatedStyle(() => {
        const pos = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const opacity = interpolate(
            pos,
            [index - 0.8, index, index + 0.8],
            [0, 1, 0],
            Extrapolation.CLAMP
        );
        const translateX = interpolate(
            pos,
            [index - 0.8, index, index + 0.8],
            [200, 0, -200],
            Extrapolation.CLAMP
        );
        return { opacity, transform: [{ translateX }] };
    });
    const { image } = useImageLoader(item.imeta.blurhash ? false : (backitem.imeta.url ?? false), {
        blurhash: item.imeta.blurhash,
    });
    return (
        <View style={StyleSheet.absoluteFill} key={item.day}>
            <AnimatedImage
                source={image}
                style={[StyleSheet.absoluteFill, styles.bgImage, bgStyle]}
            />
            <View style={styles.bgTextWrap}>
                <Animated.View style={[styles.bgTextInner, textStyle]}>
                    <Text style={styles.dayTitle}>Day #{getDayOfYear(item.event.created_at)}</Text>
                    <Text style={styles.content} numberOfLines={3} adjustsFontSizeToFit>
                        {item.event.content}
                    </Text>
                    <Text style={styles.date}>
                        {new Date(item.event.created_at * 1000).toLocaleDateString()}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
});

const AnimatedCard = React.memo(function AnimatedCard({
    item,
    index,
    scrollX,
    events,
    currentIndex,
}: {
    item: { day: number; event: NDKEvent; imeta: NDKImetaTag };
    index: number;
    scrollX: { value: number };
    events: NDKEvent[];
    currentIndex: number;
}) {
    const style = useAnimatedStyle(() => {
        const pos = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const translateY = interpolate(
            pos,
            [index - 1, index, index + 1],
            [50, 0, 50],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            pos,
            [index - 1, index, index + 1],
            [0.8, 1, 0.8],
            Extrapolation.CLAMP
        );
        return { transform: [{ translateY }, { scale }] };
    });
    const open = useStoriesView();
    const onPress = useCallback(() => {
        open(events.slice(index));
        router.push('/stories');
    }, [index, events, open]);
    const { image } = useImageLoader(item.imeta.url);
    return (
        <Animated.View style={[styles.cardWrap, style]}>
            <Pressable onPress={onPress} style={styles.cardPress}>
                <AnimatedImage source={image} style={styles.cardImage} />
            </Pressable>
        </Animated.View>
    );
});

export default function Wallpapers() {
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();
    const { pubkey } = useLocalSearchParams() as { pubkey: string };
    const { events } = useSubscribe(
        [{ kinds: [NDKKind.Image], '#t': ['olas365'], authors: [pubkey] }],
        { wrap: true, skipVerification: true },
        [pubkey]
    );

    const entries = useMemo(() => {
        const today = getDayOfYear(Date.now() / 1000) || 0;
        const days = Array.from({ length: today }, (_, i) => ({
            day: i + 1,
            event: null,
            imeta: null,
        })) as any[];
        for (const ev of events) {
            const im = ev.imetas?.[0];
            const d = getDayOfYear(ev.created_at);
            if (im?.url && d) days[d - 1] = { day: d, event: ev, imeta: im };
        }
        const valid = days
            .reverse()
            .filter(
                (e): e is { day: number; event: NDKEvent; imeta: NDKImetaTag } =>
                    !!e.event && !!e.imeta
            );
        return { slider: valid, grid: valid };
    }, [events]);

    const visible = useMemo(() => {
        return entries.slider
            .map((item, idx) => ({ item, idx }))
            .filter(({ idx }) => Math.abs(idx - currentIndex) <= 1);
    }, [entries, currentIndex]);

    const onScroll = useAnimatedScrollHandler((e) => {
        scrollX.value = e.contentOffset.x;
    });
    const onMomentumEnd = useCallback((e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / (IMAGE_WIDTH + SPACING * 2));
        setCurrentIndex(idx);
    }, []);

    const currentDay = entries.slider[currentIndex]?.day;
    const openGrid = useStoriesView();

    return (
        <ScrollView
            style={styles.container}
        >
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: '',
                    headerLeft: () => <BackButton />,
                }}
            />

            {/* full-screen */}
            <View style={{ height, backgroundColor: '#000' }}>
                <AnimatePresence>
                    {entries.slider.length === 0 && (
                        <MotiView
                            key="loading"
                            from={{ opacity: 0.8, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ type: 'timing', duration: 1000 }}
                            style={[StyleSheet.absoluteFill, styles.center]}
                        >
                            <Text>Loading …</Text>
                        </MotiView>
                    )}
                </AnimatePresence>

                <View style={StyleSheet.absoluteFill}>
                    {visible.map(({ item, idx }) => (
                        <AnimatedBackground
                            key={item.day}
                            item={item}
                            index={idx}
                            scrollX={scrollX}
                        />
                    ))}
                </View>

                <Animated.FlatList
                    data={entries.slider}
                    horizontal
                    keyExtractor={(it) => String(it.day)}
                    onScroll={onScroll}
                    onMomentumScrollEnd={onMomentumEnd}
                    scrollEventThrottle={16}
                    snapToInterval={IMAGE_WIDTH + SPACING * 2}
                    decelerationRate="fast"
                    contentContainerStyle={{
                        paddingHorizontal: (width - IMAGE_WIDTH) / 2,
                    }}
                    style={{
                        position: 'absolute',
                        bottom: SPACING + insets.bottom,
                        width: '100%',
                        height: IMAGE_HEIGHT + SPACING * 2,
                        overflow: 'visible',
                    }}
                    windowSize={3}
                    maxToRenderPerBatch={3}
                    getItemLayout={(_, idx) => ({
                        length: IMAGE_WIDTH + SPACING * 2,
                        offset: idx * (IMAGE_WIDTH + SPACING * 2),
                        index: idx,
                    })}
                    renderItem={({ item, index }) => (
                        <AnimatedCard
                            item={item}
                            index={index}
                            scrollX={scrollX}
                            events={entries.slider}
                            currentIndex={currentIndex}
                        />
                    )}
                />
            </View>

            {/* grid below */}
            <FlashList
                data={entries.grid}
                numColumns={3}
                estimatedItemSize={windowWidth / 3}
                contentContainerStyle={{ backgroundColor: '#000', paddingTop: SPACING }}
                renderItem={({ item, index }) => (
                    <DayGrid
                        index={index}
                        day={item.day}
                        event={item.event}
                        imeta={item.imeta}
                        onPress={(e) => {
                            openGrid([e]);
                            router.push('/stories');
                        }}
                    />
                )}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' } as ViewStyle,
    center: { justifyContent: 'center', alignItems: 'center' } as ViewStyle,
    bgImage: { renderToHardwareTextureAndroid: true } as ViewStyle,
    bgTextWrap: {
        flex: 0.25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    } as ViewStyle,
    bgTextInner: {
        marginBottom: SPACING * 2,
        alignItems: 'center',
        renderToHardwareTextureAndroid: true,
    } as ViewStyle,
    dayTitle: {
        color: '#fff',
        fontSize: 28,
        marginBottom: SPACING / 2,
        fontWeight: '800',
        textTransform: 'capitalize',
    } as TextStyle,
    content: {
        color: '#ffffffcc',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: SPACING,
    } as TextStyle,
    date: { color: '#ffffffaa', fontSize: 13, fontWeight: '500', textAlign: 'center' } as TextStyle,
    cardWrap: {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        marginHorizontal: SPACING,
        borderRadius: 20,
        overflow: 'hidden',
    } as ViewStyle,
    cardPress: { flex: 1 } as ViewStyle,
    cardImage: {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        resizeMode: 'cover',
        borderRadius: 20,
        renderToHardwareTextureAndroid: true,
    } as ViewStyle,
    emptyDay: { backgroundColor: '#ddd', flex: 1, width: '100%', height: '100%' } as ViewStyle,
    gridItem: { marginBottom: 1, overflow: 'hidden' } as ViewStyle,
});
