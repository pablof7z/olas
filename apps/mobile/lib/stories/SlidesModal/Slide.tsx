import { NDKImage, NDKStory, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideImage } from './SlideImage';
import StoryProgress from './SlideProgress';
import { SlideStory } from './SlideStory';
import { SlideVideo } from './SlideVideo';
import { activeSlideAtom, durationAtom, isLoadingAtom } from './store';
import StoryText from '../components/StoryText';
import { StoryHeader } from '../components/header';

const { width, height } = Dimensions.get('screen');

interface SlideProps {
    isScrolling: boolean;
    item: NDKImage | NDKVideo | NDKStory;
    index: number;
    active: boolean;
    onNextSlide: () => void;
    onPrevSlide: () => void;
    onClose: () => void;
}

export function Slide({ isScrolling, item, index, active, onNextSlide, onPrevSlide, onClose }: SlideProps) {
    const [activeSlide, setActiveSlide] = useAtom(activeSlideAtom);
    const duration = useAtomValue(durationAtom);
    const [loading, setLoading] = useAtom(isLoadingAtom);
    const [isLongPressed, setIsLongPressed] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setActiveSlide(0);
    }, [active, setActiveSlide]);

    const goPrev = useCallback(
        (newSlide: number) => {
            if (newSlide < 0) {
                return onPrevSlide();
            }
            setLoading(true);
            setActiveSlide(newSlide);
        },
        [onPrevSlide, setLoading, setActiveSlide]
    );

    const goNext = useCallback(
        (newSlide: number) => {
            if (!(item instanceof NDKStory) && newSlide > item.imetas.length - 1) {
                console.log('onNextSlide', item.imetas.length);
                return onNextSlide();
            }
            setLoading(true);
            setActiveSlide(newSlide);
        },
        [item, onNextSlide, setLoading, setActiveSlide]
    );

    // Render the appropriate content based on item type
    const renderContent = () => {
        if (item instanceof NDKStory) {
            return <SlideStory story={item} />;
        } else if (item instanceof NDKImage || item instanceof NDKVideo) {
            // Both NDKImage and NDKVideo have imetas property
            const imeta = item.imetas[activeSlide];
            if (!imeta?.url) return null;

            // Determine if it's video based on the instance type
            return item instanceof NDKVideo ? <SlideVideo imeta={imeta} /> : <SlideImage imeta={imeta} />;
        }
        return null;
    };

    return (
        <View style={{ width, height }}>
            <View style={[StyleSheet.absoluteFillObject]}>{renderContent()}</View>

            {/* Touch handlers for navigation */}
            <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row' }]}>
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
                    <View style={{ backgroundColor: 'transparent', flex: 1 }} />
                </TouchableWithoutFeedback>
            </View>

            {/* Progress indicators */}
            <View
                key={`story-progress-${index}`}
                style={{
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-evenly',
                    position: 'absolute',
                    top: insets.top,
                }}>
                {[0].map((_, i) => {
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

            {/* Header */}
            <StoryHeader item={item} onClose={onClose} />

            {/* Show text only for NDKImage and NDKVideo */}
            {!(item instanceof NDKStory) && (
                <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, padding: 10 }}>
                    <StoryText text={item.content} event={item} />
                </View>
            )}
        </View>
    );
}
