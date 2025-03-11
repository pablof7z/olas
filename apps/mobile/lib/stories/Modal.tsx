import { showStoriesModalAtom, storiesAtom } from "@/lib/stories/store";
import { NDKImage, NDKImetaTag, NDKVideo } from "@nostr-dev-kit/ndk-mobile";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atom } from "jotai";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    FlatListProps, StyleSheet,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { Image, ImageStyle, useImage } from "expo-image";
import { StoryHeader } from "./components/header";
import StoryText from './components/StoryText';
import { urlIsVideo } from "@/utils/media";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
    Easing,
    interpolate,
    Extrapolation,
    runOnJS,
    SharedValue
} from "react-native-reanimated";
import { router } from "expo-router";

const { width, height } = Dimensions.get("screen");

const isLoadingAtom = atom(false);
const durationAtom = atom(-1);

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

const isOverLandscapeThreshold = (width: number, height: number) => {
    return (width / height) > 1.1;
};

interface StoryProgressProps {
    isLongPressed: boolean;
    done: boolean;
    activeIndex: number;
    index: number;
    onEnd: (index: number) => void;
    active: boolean;
    duration?: number;
}

const StoryProgress = ({
    isLongPressed,
    done,
    activeIndex,
    index,
    onEnd,
    active,
    duration = 8000,
}: StoryProgressProps) => {
    const progress = useSharedValue(-width / 3);
    const [progressWidth, setProgressWidth] = useState<number | null>(null);
    const longPressElapsedDuration = useRef(0);
    const animationStarted = useRef(false);
    const currentAnimation = useRef<any>(null);

    console.log('duration in story progress', duration);

    const animatedStyle = useAnimatedStyle(() => ({
        height: 4,
        backgroundColor: "white",
        transform: [{ translateX: progress.value }],
    }));

    const startAnimation = useCallback((dur: number) => {
        console.log('starting animation', dur);
        if (currentAnimation.current) {
            progress.value = progress.value;
            currentAnimation.current = null;
        }
        
        progress.value = withTiming(0, {
            duration: dur,
            easing: Easing.linear,
        }, (finished) => {
            currentAnimation.current = null;
            if (finished && active) {
                runOnJS(onEnd)(index + 1);
            }
        });
    }, [active, index, onEnd]);

    // Update elapsed time during long press
    useEffect(() => {
        if (!progressWidth || !active) return;
        
        const updateElapsed = () => {
            longPressElapsedDuration.current = Math.abs(
                (progress.value * duration) / progressWidth
            );
        };
        updateElapsed();
    }, [progress.value, progressWidth, active, duration]);

    // Main animation effect
    useEffect(() => {
        if (!progressWidth || duration <= 0) return;
        
        // Reset on inactive
        if (!active) {
            progress.value = -progressWidth;
            animationStarted.current = false;
            currentAnimation.current = null;
            return;
        }

        // Complete on done
        if (done) {
            progress.value = 0;
            return;
        }

        // Handle animation start/resume
        if (active && !isLongPressed) {
            if (!animationStarted.current) {
                animationStarted.current = true;
                progress.value = -progressWidth;
                startAnimation(duration);
            }
        } else if (isLongPressed) {
            // Pause animation by keeping current progress
            progress.value = progress.value;
        }
    }, [active, done, duration, progressWidth, isLongPressed, startAnimation]);

    return (
        <View
            key={index}
            style={{
                height: 4,
                flex: 1,
                overflow: "hidden",
                marginRight: 8,
                backgroundColor: "rgba(255,255,255,0.4)",
            }}
        >
            <Animated.View
                onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
                style={animatedStyle}
            />
        </View>
    );
};

function SlideImage({ imeta }: { imeta: NDKImetaTag }) {
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);
    const [isLandscape, setIsLandscape] = useState(false);

    const imageSource = useImage({
        uri: imeta.url,
        blurhash: imeta.blurhash,
    }, {
        onError: (error) => {
            console.log('error', error);
        }
    });

    useEffect(() => {
        if (!imageSource?.width || !imageSource?.height) return;
        
        if (!isLandscape && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
            setIsLandscape(true);
        } else if (isLandscape && !isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
            setIsLandscape(false);
        }
    }, [isLandscape, imageSource?.width, imageSource?.height]);

    const style = useMemo(() => {
        const style: ImageStyle = {};

        style.width = screenWidth;
        style.height = screenHeight;

        return style;
    }, [imageSource?.width, imageSource?.height, isLandscape]);

    return (
        <Image
            contentFit="cover"
            source={imageSource}
            style={style}
            onLoadStart={() => {
                setIsLoading(true);
            }}
            onDisplay={() => {
                setIsLoading(false);
                setDuration(8000);
                if (imageSource?.width && imageSource?.height && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
                    setIsLandscape(true);
                }
            }}
            onLoad={() => {}}
            onLoadEnd={() => {}}
        />
    );
}

function SlideVideo({ imeta }: { imeta: NDKImetaTag }) {
    const setLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    useEffect(() => {
        console.log('slide video setting loading', imeta.url);
        setLoading(true);
    }, [imeta.url]);
    
    const player = useVideoPlayer({
        uri: imeta.url,
    }, (player) => {
        player.muted = false;
        player.loop = false;
        player.addListener('statusChange', () => {
            if (player.status === 'readyToPlay') {
                console.log('slide video setting loading false', imeta.url, { duration: player.duration });
                player.play();
                setLoading(false);
            }
        });
        player.addListener('playingChange', (playing) => {
            if (playing) {
                setDuration(player.duration * 1000);
            }
        });
    });
    
    return (
        <VideoView
            player={player}
            contentFit="cover"
            style={{ flex: 1 }}
        />
    );
}

const Slide = ({
    isScrolling,
    item,
    index,
    active,
    onNextSlide,
    onPrevSlide,
    onClose,
}: {
    isScrolling: boolean;
    item: NDKImage | NDKVideo;
    index: number;
    active: boolean;
    onNextSlide: () => void;
    onPrevSlide: () => void;
    onClose: () => void;
}) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const duration = useAtomValue(durationAtom);
    const [loading, setLoading] = useAtom(isLoadingAtom);

    useEffect(() => {
        setActiveSlide(0);
    }, [active]);

    const goPrev = useCallback(
        (newSlide: number) => {
            if (newSlide < 0) {
                return onPrevSlide();
            }
            setLoading(true);
            setActiveSlide(newSlide);
        },
        [activeSlide]
    );

    const goNext = useCallback(
        (newSlide: number) => {
            console.log('goNext', newSlide, item.imetas.length);
            if (newSlide > item.imetas.length - 1) {
                console.log('onNextSlide', item.imetas.length);
                return onNextSlide();
            }
            setLoading(true);
            setActiveSlide(newSlide);
        },
        [activeSlide]
    );

    const [isLongPressed, setIsLongPressed] = useState(false);

    const url = item.imetas[activeSlide].url;

    const insets = useSafeAreaInsets();
    
    if (!url) return null;

    const type = urlIsVideo(url) ? 'video' : 'image';

    return (
        <View style={{ width, height }}>
            <View style={[StyleSheet.absoluteFillObject]}>
                {type === 'image' ? (
                    <SlideImage imeta={item.imetas[activeSlide]} />
                ) : (
                    <SlideVideo imeta={item.imetas[activeSlide]} />
                )}
            </View>
            <View style={[StyleSheet.absoluteFillObject, { flexDirection: "row" }]}>
                <TouchableWithoutFeedback
                    delayLongPress={200}
                    onPressOut={() => {
                        setIsLongPressed(false);
                    }}
                    onLongPress={() => {
                        setIsLongPressed(true);
                    }}
                    onPress={() => goPrev(activeSlide - 1)}
                >
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback
                    delayLongPress={200}
                    onPressOut={() => {
                        setIsLongPressed(false);
                    }}
                    onLongPress={() => {
                        setIsLongPressed(true);
                    }}
                    onPress={() => goNext(activeSlide + 1)}
                >
                    <View style={{ backgroundColor: "transparent", flex: 1 }} />
                </TouchableWithoutFeedback>
            </View>
            <View
                key={`story-progress-${index}`}
                style={{
                    paddingHorizontal: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    position: "absolute",
                    top: insets.top,
                }}
            >
                {item.imetas.map((_, i) => {
                    return (
                        <StoryProgress
                            isLongPressed={isLongPressed || isScrolling}
                            activeIndex={activeSlide}
                            index={i}
                            key={`story-progress-${index}-${i}`}
                            done={activeSlide > i}
                            active={activeSlide === i && !loading && active}
                            duration={duration}
                            onEnd={goNext}
                        />
                    );
                })}
            </View>
            <StoryHeader item={item} onClose={onClose} />
            <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, padding: 10 }}>
                <StoryText text={item.content} event={item} />
            </View>
        </View>
    );
};

const perspective = width;
const angle = Math.atan(perspective / (width / 2));

const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<NDKImage | NDKVideo>>(FlatList);

interface StoryItemProps {
    item: NDKImage | NDKVideo;
    index: number;
    scrollX: SharedValue<number>;
    activeIndex: number;
    storiesLength: number;
    onClose: () => void;
    isScrolling: boolean;
    flatListRef: React.RefObject<FlatList<NDKImage | NDKVideo>>;
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
    const inputRange = [
        (index - 0.5) * width,
        index * width,
        (index + 0.5) * width,
    ];

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        ),
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
                rotateY: `${interpolate(
                    scrollX.value,
                    inputRange,
                    [angle / 2, 0, -angle / 2],
                    Extrapolation.CLAMP
                )}rad`,
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

    console.log('story item', item.id);

    return (
        <Animated.View style={animatedStyle}>
            <Slide
                item={item}
                index={index}
                active={index === activeIndex}
                onNextSlide={() => {
                    console.log('onNextSlide', index, storiesLength);
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
    const [showStoriesModal, setShowStoriesModal] = useAtom(showStoriesModalAtom);
    const scrollX = useSharedValue(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const stories = useAtomValue(storiesAtom) as NDKImage[];
    const ref = useRef<FlatList<NDKImage>>(null);
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    const close = useCallback(() => {
        console.log('closing modal');
        onClose ? onClose() : router.back();
        setShowStoriesModal(false);
        setActiveIndex(0);
        setIsLoading(true);
        setDuration(-1);
        ref.current?.scrollToOffset({ offset: 0, animated: false });
    }, [setShowStoriesModal, onClose]);

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
                keyExtractor={(item: NDKImage | NDKVideo) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                pagingEnabled
                renderItem={({ item, index }: { item: NDKImage | NDKVideo; index: number }) => (
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
        justifyContent: "center",
        backgroundColor: "#000",
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
});