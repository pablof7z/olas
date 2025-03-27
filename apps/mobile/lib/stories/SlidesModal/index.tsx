import type { NDKImage, NDKStory, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, type FlatListProps, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    runOnJS,
    type SharedValue,
} from 'react-native-reanimated';

import { Slide } from './Slide';

import {
    activeSlideAtom,
    durationAtom,
    isLoadingAtom,
    showStoriesModalAtom,
    storiesAtom,
} from '@/lib/stories/SlidesModal/store';

const { width } = Dimensions.get('screen');

const perspective = width;
const angle = Math.atan(perspective / (width / 2));

const AnimatedFlatList =
    Animated.createAnimatedComponent<FlatListProps<NDKImage | NDKVideo | NDKStory>>(FlatList);

interface StoryItemProps {
    item: NDKImage | NDKVideo | NDKStory;
    index: number;
    scrollX: SharedValue<number>;
    activeIndex: number;
    storiesLength: number;
    onClose: () => void;
    isScrolling: boolean;
    flatListRef: React.RefObject<FlatList<NDKImage | NDKVideo | NDKStory>>;
}

const StoryItem = ({
    item,
    index,
    scrollX,
    activeIndex,
    storiesLength,
    onClose,
    isScrolling,
    flatListRef,
}: StoryItemProps) => {
    const inputRange = [(index - 0.5) * width, index * width, (index + 0.5) * width];

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP),
        transform: [
            { perspective: width * 4 },
            {
                translateX: interpolate(
                    scrollX.value,
                    inputRange,
                    [-width / 2, 0, width / 2],
                    Extrapolation.CLAMP
                ),
            },
            {
                rotateY: `${interpolate(scrollX.value, inputRange, [angle / 2, 0, -angle / 2], Extrapolation.CLAMP)}rad`,
            },
            {
                translateX: interpolate(
                    scrollX.value,
                    inputRange,
                    [width / 2, 0, -width / 2],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Slide
                item={item}
                index={index}
                active={index === activeIndex}
                onNextSlide={() => {
                    if (index + 1 >= storiesLength) {
                        onClose();
                    } else {
                        flatListRef.current?.scrollToOffset({
                            offset: (index + 1) * width,
                            animated: true,
                        });
                    }
                }}
                isScrolling={isScrolling}
                onPrevSlide={() => {
                    flatListRef.current?.scrollToOffset({
                        offset: (index - 1) * width,
                        animated: true,
                    });
                }}
                onClose={onClose}
            />
        </Animated.View>
    );
};

export default function StoriesModal({ onClose }: { onClose?: () => void }) {
    const [_showStoriesModal, setShowStoriesModal] = useAtom(showStoriesModalAtom);
    const scrollX = useSharedValue(0);
    const [activeIndex, setActiveIndex] = useAtom(activeSlideAtom);
    const [isScrolling, setIsScrolling] = useState(false);
    const stories = useAtomValue(storiesAtom) as NDKImage[];
    const ref = useRef<FlatList<NDKImage | NDKVideo | NDKStory>>(null);
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    const close = useCallback(() => {
        onClose ? onClose() : router.back();
        setShowStoriesModal(false);
        setActiveIndex(0);
        setIsLoading(true);
        setDuration(-1);
        ref.current?.scrollToOffset({ offset: 0, animated: false });
    }, [setShowStoriesModal, onClose, setActiveIndex, setIsLoading, setDuration]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onBeginDrag: () => {
            runOnJS(setIsScrolling)(true);
        },
        onEndDrag: () => {
            runOnJS(setIsScrolling)(false);
        },
        onMomentumEnd: (event) => {
            runOnJS(setActiveIndex)(Math.floor(event.contentOffset.x / width));
        },
    });

    return (
        <Animated.View style={styles.container}>
            <AnimatedFlatList
                ref={ref}
                data={stories}
                keyExtractor={(item: NDKImage | NDKVideo | NDKStory) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                pagingEnabled
                renderItem={({
                    item,
                    index,
                }: { item: NDKImage | NDKVideo | NDKStory; index: number }) => (
                    <StoryItem
                        item={item}
                        index={index}
                        scrollX={scrollX}
                        activeIndex={activeIndex}
                        storiesLength={stories.length}
                        onClose={close}
                        isScrolling={isScrolling}
                        flatListRef={ref}
                    />
                )}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
