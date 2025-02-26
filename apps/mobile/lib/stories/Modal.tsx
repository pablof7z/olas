import { showStoriesModalAtom, storiesAtom } from "@/lib/stories/store";
import { NDKImage, NDKImetaTag } from "@nostr-dev-kit/ndk-mobile";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atom } from "jotai";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { Image, ImageStyle, useImage } from "expo-image";
import { StoryHeader } from "./components/header";
import TopZaps from "@/components/events/TopZaps";
import Zaps from "@/components/events/Post/Reactions/Zaps";
import StoryText from './components/StoryText';
import { urlIsVideo } from "@/utils/media";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("screen");

const StoryProgress = ({
  isLongPressed,
  done,
  activeIndex,
  index,
  onEnd,
  active,
  duration = 8000,
}) => {
  const progress = useRef(new Animated.Value(-width / 3)).current;
  const [progressWidth, setProgressWidth] = useState(null);
  const longPressElapsedDuration = useRef(0);

  const animation = (durations) =>
    Animated.timing(progress, {
      toValue: 0,
      duration: durations,
      easing: Easing.linear,
      useNativeDriver: true,
    });

  useEffect(() => {
    // we need to store the passed duration so when we
    // release the longpress is going to start the timing
    // from with the elapsed duration.
    const listener = progress.addListener(({ value }) => {
      longPressElapsedDuration.current = Math.abs(
        (value * duration) / progressWidth
      );
    });

    return () => {
      progress.removeListener(listener);
      progress.removeAllListeners();
    };
  });

  useEffect(() => {
    if (isLongPressed) {
      progress.stopAnimation();
    } else {
      if (active) {
        // start animation with elapsed duration
        animation(longPressElapsedDuration.current).start((status) => {
          // in case of previous, we need to cancel the animation
          // or move to next when the animation has finished.
          if (status.finished) {
            onEnd(index + 1);
          }
        });
      }
    }
  }, [isLongPressed, progressWidth]);
  useEffect(() => {
    progress.setValue(-progressWidth);
    if (active) {
      progress.stopAnimation();
      progress.setValue(-progressWidth);
      const anim = animation(duration);
      anim.start((status) => {
        if (status.finished) {
          onEnd(index + 1);
        }
      });
      
      return () => anim.stop();
    }

    if (done) {
      progress.setValue(0);
    }
  }, [active, done, duration, progressWidth]);

  useEffect(() => {
    progress.setValue(-progressWidth);
  }, [progressWidth]);

  return (
    <View
      key={index}
      style={{
        height: 4,
        flex: 1,
        overflow: "hidden",
        marginRight: 8,
        backgroundColor: "rgba(255,255,255,0.4)",
      }}>
      <Animated.View
        onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
        style={{
          height: 4,
          backgroundColor: "white",
          transform: [
            {
              translateX: progress,
            },
          ],
        }}
      />
    </View>
  );
};

const isLoadingAtom = atom(false);
const durationAtom = atom(-1);

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

const isOverLandscapeThreshold = (width: number, height: number) => {
    return (width / height) > 1.1;
}

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
    }, [ isLandscape, imageSource?.width, imageSource?.height ])

    const style = useMemo(() => {
        const style: ImageStyle = {
        }

        style.width = screenWidth;
        style.height = screenHeight;

        if (imageSource?.width && imageSource?.height) {
            if (isLandscape) {
                style.aspectRatio = imageSource.width / imageSource.height;
                style.transform = [
                    { rotate: '90deg' },
                    { translateY: ((imageSource.width / imageSource.height) * screenWidth) }
                ]
            }
        }
        
        return style;
    }, [ imageSource?.width, imageSource?.height, isLandscape ])

    return (
            <Image
                contentFit="contain"
                source={imageSource}
                style={style}
                onLoadStart={() => {
                    setIsLoading(true);
                }}
                onDisplay={() => {
                  console.log('display', imageSource?.width, imageSource?.height);
                    setIsLoading(false);
                    setDuration(8000);
                    if (imageSource?.width && imageSource?.height && isOverLandscapeThreshold(imageSource?.width, imageSource?.height)) {
                        setIsLandscape(true);
                    }
                }}
                onLoad={() => {
                    console.log('load', imageSource?.width, imageSource?.height);
                }}
                onLoadEnd={() => {
                    console.log('load end', imageSource?.width, imageSource?.height);
                    

                    console.log('image width', imageSource.width, 'image height', imageSource.height);
                }}
        />
    )
}

function SlideVideo({ imeta }: { imeta: NDKImetaTag }) {
    const setLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);
    
    const player = useVideoPlayer({
        uri: imeta.url,
    }, (player) => {
        player.muted = false;
        player.loop = false;
        player.addListener('statusChange', () => {
            if (player.status === 'readyToPlay') {
                setLoading(false);
                setDuration(player.duration);
            }
        })
    })
    
    return (
        <VideoView
            player={player}
            resizeMode='cover'
            style={{ flex: 1 }}
          />
    )
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
  item: NDKImage;
  index: number;
  active: boolean;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onClose: () => void;
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const duration = useAtomValue(durationAtom);
  console.log('slide duration', duration);
  const [loading, setLoading] = useAtom(isLoadingAtom);

  useEffect(() => {
    setActiveSlide(0);
  }, [active]);

  const goPrev = useCallback(
    (newSlide) => {
      if (newSlide < 0) {
        return onPrevSlide();
      }
      setLoading(true);
      setActiveSlide(newSlide);
    },
    [activeSlide]
  );

  const goNext = useCallback(
    (newSlide) => {
      if (newSlide > item.imetas.length - 1) {
        return onNextSlide();
      }
      setLoading(true);
      setActiveSlide(newSlide);
    },
    [activeSlide]
  );

  const [isLongPressed, setIsLongPressed] = useState(false);

  if (!(item instanceof NDKImage)) return null;

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
          onPress={() => goPrev(activeSlide - 1)}>
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
          onPress={() => goNext(activeSlide + 1)}>
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
        }}>
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
        <TopZaps
          event={item}
        />

        <Zaps
          event={item}
          inactiveColor={false}
        />
        <StoryText text={item.content} />
      </View>
    </View>
  );
};



const perspective = width;
const angle = Math.atan(perspective / (width / 2));

export default function StoriesModal() {
    const [showStoriesModal, setShowStoriesModal] = useAtom(showStoriesModalAtom);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const stories = useAtomValue(storiesAtom);
    const ref = useRef<Animated.FlatList>(null);
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    const close = useCallback(() => {
      setShowStoriesModal(false);
      setActiveIndex(0);
      setIsLoading(true);    // reset loading
      setDuration(-1);       // reset duration
      ref.current?.scrollToOffset({ offset: 0, animated: false });
    }, [setShowStoriesModal]);

    if (!showStoriesModal) return null;

    return (
      <Modal visible={showStoriesModal} onDismiss={close}>
      <View style={styles.container}>
        <Animated.FlatList
          ref={ref}
          data={stories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
            }
          )}
          pagingEnabled
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          onMomentumScrollEnd={(ev) => {
            setActiveIndex(Math.floor(ev.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 0.5) * width,
              index * width,
              (index + 0.5) * width,
            ];
            const rotateY = scrollX.interpolate({
              inputRange,
              outputRange: [`${angle / 2}rad`, "0rad", `-${angle / 2}rad`],
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.5, 1, 0.5],
            });

            const translateX1 = scrollX.interpolate({
              inputRange,
              outputRange: [-width / 2, 0, width / 2],
              extrapolate: "clamp",
            });
            const translateX2 = scrollX.interpolate({
              inputRange,
              outputRange: [width / 2, 0, -width / 2],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                style={{
                  opacity,
                  transform: [
                    { perspective: width * 4 },
                    { translateX: translateX1 },
                    { rotateY },
                    { translateX: translateX2 },
                  ],
                }}>
                <Slide
                  item={item}
                  index={index}
                  active={index === activeIndex}
                  onNextSlide={() => {
                    if (index + 1 >= stories.length) {
                      close();
                    } else {
                      ref.current?.scrollToOffset({
                        offset: (index + 1) * width,
                        animated: true,
                      });
                    }
                  }}
                  isScrolling={isScrolling}
                  onPrevSlide={() => {
                    ref.current?.scrollToOffset({
                      offset: (index - 1) * width,
                      animated: true,
                    });
                  }}
                  onClose={close}
                />
              </Animated.View>
            );
          }}
        />
        </View>
      </Modal>
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
