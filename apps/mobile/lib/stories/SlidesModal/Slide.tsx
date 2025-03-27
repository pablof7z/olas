import { NDKImage, NDKStory, NDKVideo } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StoryText from '../components/StoryText';
import { StoryHeader } from '../components/header';
import { SlideImage } from './SlideImage';
import StoryProgress from './SlideProgress';
import { SlideStory } from './SlideStory';
import { SlideVideo } from './SlideVideo';

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

export function Slide({
    isScrolling,
    item,
    index,
    active,
    onNextSlide,
    onPrevSlide,
    onClose,
}: SlideProps) {
    const [activeImeta, setActiveImeta] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLongPressed, setIsLongPressed] = useState(false);
    const insets = useSafeAreaInsets();

    const handleContentLoaded = useCallback((contentDuration: number) => {
        setDuration(contentDuration);
        setLoading(false);
    }, []);

    const goPrev = useCallback(
        (newSlide: number) => {
            if (newSlide >= 0) setActiveImeta(newSlide);
            else onPrevSlide();
        },
        [onPrevSlide]
    );

    const goNext = useCallback(
        (newSlide: number) => {
            if (!(item instanceof NDKStory)) {
                if (newSlide < item.imetas.length - 1) setActiveImeta(newSlide);
            }

            onNextSlide();
        },
        [item, onNextSlide]
    );

    // Render the appropriate content based on item type
    const renderContent = () => {
        if (item instanceof NDKStory) {
            // For NDKStory, we consider it active only when it's the current slide (active=true) and activeSlide=0
            return (
                <SlideStory
                    story={item}
                    isActiveSlide={active}
                    onContentLoaded={handleContentLoaded}
                />
            );
        } else if (item instanceof NDKImage || item instanceof NDKVideo) {
            // Both NDKImage and NDKVideo have imetas property
            const imeta = item.imetas[activeImeta];
            if (!imeta?.url) return null;

            // Determine if it's video based on the instance type
            return item instanceof NDKVideo ? (
                <SlideVideo
                    imeta={imeta}
                    isActiveSlide={active}
                    onNextSlide={() => goNext(index + 1)}
                    onContentLoaded={handleContentLoaded}
                />
            ) : (
                <SlideImage imeta={imeta} onContentLoaded={handleContentLoaded} />
            );
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
                    onPressOut={() => setIsLongPressed(false)}
                    onLongPress={() => setIsLongPressed(true)}
                    onPress={() => goPrev(activeImeta - 1)}
                >
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback
                    delayLongPress={200}
                    onPressOut={() => setIsLongPressed(false)}
                    onLongPress={() => setIsLongPressed(true)}
                    onPress={() => goNext(activeImeta + 1)}
                >
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
                }}
            >
                <StoryProgress
                    isLongPressed={isLongPressed || isScrolling}
                    activeIndex={activeImeta}
                    index={0}
                    key={`story-progress-${index}-${0}`}
                    done={activeImeta > 0}
                    active={activeImeta === 0 && !loading && active}
                    duration={duration}
                    onEnd={goNext}
                />
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
