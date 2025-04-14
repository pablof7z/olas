import {
    type NDKEvent,
    NDKFilter,
    type NDKImage,
    type NDKImetaTag,
    NDKKind,
    NDKSubscriptionCacheUsage,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { AnimatedFlashList, FlashList } from '@shopify/flash-list';
import { Image as ExpoImage, Image, type ImageRef, useImage } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AnimatePresence } from 'framer-motion';
import { MotiView } from 'moti';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/buttons/back-button';
import StoriesModal from '@/lib/stories/SlidesModal';
import { useStoriesView } from '@/lib/stories/store';

const { width, height } = Dimensions.get('screen');

const IMAGE_WIDTH = width * 0.8;
const IMAGE_HEIGHT = height * 0.75;
const SPACING = 10;

const currentYear = new Date().getFullYear();

function getDayOfYear(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
    const difference_In_Days = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (year !== currentYear) return;
    return difference_In_Days;
}

function AnimatedBackground({
    item,
    index,
    scrollX,
    cardCount,
}: {
    item: { day: number; event: NDKEvent; imeta: NDKImetaTag };
    index: number;
    scrollX: { value: number };
    cardCount: number;
    // image: ImageRef | null; // Removed unused prop
}) {
    const imageAnimatedStyle = useAnimatedStyle(() => {
        const animated = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const opacity = interpolate(
            animated,
            [index - 0.8, index, index + 0.8],
            [0, 0.4, 0],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    const textAnimatedStyle = useAnimatedStyle(() => {
        const animated = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const textOpacity = interpolate(
            animated,
            [index - 0.8, index, index + 0.8],
            [0, 1, 0],
            Extrapolation.CLAMP
        );
        const textTranslate = interpolate(
            animated,
            [index - 0.8, index, index + 0.8],
            [200, 0, -200],
            Extrapolation.CLAMP
        );
        return {
            opacity: textOpacity,
            transform: [{ translateX: textTranslate }],
        };
    });

    return (
        <SafeAreaView key={`bg-item-${item.day}`} style={StyleSheet.absoluteFill}>
            <AnimatedImage
                source={{ uri: item.imeta.url }}
                // blurRadius is not a standard style prop here, removed. Apply blur via other means if needed.
                style={[StyleSheet.absoluteFill, imageAnimatedStyle]}
                // blurhash removed - not directly supported by Animated.createAnimatedComponent(Image)
            />
            <View
                style={{
                    flex: 0.25,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: cardCount + 1,
                }}
            >
                <Animated.View
                    style={[{ marginBottom: SPACING * 2, alignItems: 'center' }, textAnimatedStyle]}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 28,
                            marginBottom: SPACING / 2,
                            fontWeight: '800',
                            textTransform: 'capitalize',
                        }}
                    >
                        Day #{getDayOfYear(item.event.created_at)}
                    </Text>
                    <Text
                        style={{
                            color: '#ffffffcc',
                            fontSize: 16,
                            fontWeight: '500',
                            textAlign: 'center',
                            marginBottom: SPACING,
                        }}
                        numberOfLines={3}
                        adjustsFontSizeToFit
                    >
                        {item.event.content}
                    </Text>
                    <Text
                        style={{
                            color: '#ffffffaa',
                            fontSize: 13,
                            fontWeight: '500',
                            textAlign: 'center',
                        }}
                    >
                        {new Date(item.event.created_at * 1000).toLocaleDateString()}
                    </Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

function AnimatedRenderItem({
    item,
    index,
    scrollX,
    events,
}: {
    item: { day: number; event: NDKEvent; imeta: NDKImetaTag };
    index: number;
    scrollX: { value: number };
    events: NDKEvent[];
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const animated = scrollX.value / (IMAGE_WIDTH + SPACING * 2);
        const translateY = interpolate(
            animated,
            [index - 1, index, index + 1],
            [100, 40, 100],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animated,
            [index - 1, index, index + 1],
            [1.5, 1, 1.5],
            Extrapolation.CLAMP
        );
        return {
            transform: [{ translateY }, { scale }],
        };
    });

    const openStory = useStoriesView();

    const [showModal, setShowModal] = useState(false);
    const handleCardPress = useCallback(() => {
        const eventsForStories = events.slice(index, -1);
        openStory(eventsForStories);
        // setShowModal(true);
        router.push('/stories');
    }, [index, item.event, openStory]);

    return (
        <Animated.View
            style={{
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
                margin: SPACING,
                overflow: 'hidden',
                borderRadius: 30,
            }}
        >
            <Pressable onPress={handleCardPress}>
                <AnimatedImage
                    // blurhash removed - not directly supported by Animated.createAnimatedComponent(Image)
                    style={[
                        {
                            width: IMAGE_WIDTH,
                            height: IMAGE_HEIGHT,
                            resizeMode: 'cover',
                            borderRadius: 20,
                        },
                        animatedStyle,
                    ]}
                    source={{ uri: item.imeta.url }}
                />
            </Pressable>
            {showModal && (
                <Modal transparent animationType="slide">
                    <StoriesModal onClose={() => setShowModal(false)} />
                </Modal>
            )}
        </Animated.View>
    );
}

export default function Wallpapers() {
    const scrollX = useSharedValue(0);
    const { pubkey } = useLocalSearchParams() as { pubkey: string };
    const { events } = useSubscribe<NDKImage>(
        [{ kinds: [NDKKind.Image], '#t': ['olas365', '#Olas365', 'olas365'], authors: [pubkey] }],
        { wrap: true },
        [pubkey]
    );

    const imageLoadStartedRef = useRef<Set<string>>(new Set());

    const [cardEntries, gridEntries] = useMemo(() => {
        const dayOfTodayInTheYear = getDayOfYear(new Date().getTime() / 1000);

        // Ensure dayOfTodayInTheYear is a valid number
        if (typeof dayOfTodayInTheYear !== 'number' || dayOfTodayInTheYear <= 0) {
            return [[], []]; // Return empty arrays if day is invalid
        }

        let days = Array.from({ length: dayOfTodayInTheYear }, (_, index) => ({
            day: index + 1,
            event: null,
            imeta: null,
        })) as { day: number; event: NDKEvent | null; imeta: NDKImetaTag | null }[];

        for (const event of events) {
            const imeta = event?.imetas?.[0];
            if (!imeta?.url) continue;
            const day = getDayOfYear(event.created_at);
            if (!day) continue;
            days[day - 1].event = event;
            days[day - 1].imeta = imeta;

            if (!imageLoadStartedRef.current.has(imeta.url)) {
                imageLoadStartedRef.current.add(imeta.url);
                ExpoImage.prefetch(imeta.url, 'memory-disk');
            }
        }

        days = days.reverse();

        // Filter both card and grid entries to ensure event and imeta are not null
        const validEntries = days.filter((e): e is { day: number; event: NDKEvent; imeta: NDKImetaTag } => !!e.event && !!e.imeta);
        return [validEntries, validEntries]; // Use filtered entries for both card and grid
    }, [events]);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => <Header />,
                }}
            />
            <ScrollView>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#000',
                        justifyContent: 'flex-end',
                        height,
                    }}
                >
                    <AnimatePresence>
                        {cardEntries.length === 0 && (
                            <MotiView
                                key="loading"
                                from={{ opacity: 0.8, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{
                                    type: 'timing',
                                    duration: 1000,
                                }}
                                style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'absolute',
                                    width,
                                    height,
                                }}
                            >
                                <Text>Loading ...</Text>
                            </MotiView>
                        )}
                    </AnimatePresence>
                    <View style={StyleSheet.absoluteFill}>
                        {cardEntries.map((item, index) => (
                            <AnimatedBackground
                                key={`bg-item-${item.day}`}
                                item={item}
                                index={index}
                                scrollX={scrollX}
                                cardCount={cardEntries.length}
                            />
                        ))}
                    </View>
                    {/* Wrap FlashList in a container with an explicit height */}
                    <View style={{ height: IMAGE_HEIGHT + SPACING * 2, flexDirection: 'column' }}>
                        <Animated.FlatList
                            data={cardEntries}
                            extraData={cardEntries}
                            // Use optional chaining for keyExtractor
                            keyExtractor={(item) => String(item.event?.id ?? item.day)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingHorizontal: (width - (IMAGE_WIDTH + SPACING * 2)) / 2,
                            }}
                            onScroll={scrollHandler}
                            scrollEventThrottle={16}
                            snapToInterval={IMAGE_WIDTH + SPACING * 2}
                            decelerationRate="fast"
                            renderItem={({ item, index }) => (
                                <AnimatedRenderItem
                                    item={item}
                                    index={index}
                                    scrollX={scrollX}
                                    events={events}
                                />
                            )}
                        />
                    </View>
                </View>
                <Olas365View entries={gridEntries} />
            </ScrollView>
        </>
    );
}

function Header() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[headerStyle.container, { paddingTop: insets.top }]}>
            <BackButton />
        </View>
    );
}

const headerStyle = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

function EmptyDay() {
    return <View style={{ backgroundColor: '#ddd', flex: 1, width: '100%', height: '100%' }} />;
}

// Adjust expected type for entries to match the filtered data
export function Olas365View({ entries }: { entries: { day: number; event: NDKEvent; imeta: NDKImetaTag }[] }) {
    const openStory = useStoriesView();
    const handleCardPress = useCallback(
        (event: NDKEvent) => { // Adjust type here as well
            openStory([event]);
            router.push('/stories');
        },
        [openStory]
    );

    const renderItem = useCallback(
        ({ item: { day, event, imeta } }: { item: { day: number; event: NDKEvent; imeta: NDKImetaTag } }) => { // Adjust type
            return (
                <View
                    style={{
                        width: Dimensions.get('window').width / 3,
                        height: Dimensions.get('window').width / 3,
                        margin: 0.5,
                        overflow: 'hidden',
                    }}
                >
                    {event ? (
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => handleCardPress(event)}
                        >
                            <AnimatedImage
                                source={{ uri: imeta.url }} // Use imeta directly
                                style={{ flex: 1 }}
                            />
                        </TouchableOpacity>
                    ) : (
                        <EmptyDay />
                    )}
                    <Text
                        style={{
                            padding: 4,
                            fontSize: 12,
                            color: 'gray',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                        }}
                    >
                        Day {day}
                    </Text>
                </View>
            );
        },
        []
    );

    return (
        <FlashList
            data={entries}
            estimatedItemSize={500}
            keyExtractor={(e) => e.day.toString()}
            scrollEventThrottle={100}
            numColumns={3}
            renderItem={renderItem}
            disableIntervalMomentum
        />
    );
}
