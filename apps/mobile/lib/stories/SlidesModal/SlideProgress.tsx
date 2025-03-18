import { Dimensions, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { useCallback, useEffect, useRef, useState } from 'react';

const { width } = Dimensions.get('screen');

export interface StoryProgressProps {
    isLongPressed: boolean;
    done: boolean;
    activeIndex: number;
    index: number;
    onEnd: (index: number) => void;
    active: boolean;
    duration?: number;
}

export const StoryProgress = ({ isLongPressed, done, activeIndex, index, onEnd, active, duration = 8000 }: StoryProgressProps) => {
    const progress = useSharedValue(-width / 3);
    const [progressWidth, setProgressWidth] = useState<number | null>(null);
    const longPressElapsedDuration = useRef(0);
    const animationStarted = useRef(false);
    const currentAnimation = useRef<any>(null);

    console.log('duration in story progress', duration);

    const animatedStyle = useAnimatedStyle(() => ({
        height: 4,
        backgroundColor: 'white',
        transform: [{ translateX: progress.value }],
    }));

    const startAnimation = useCallback(
        (dur: number) => {
            console.log('starting animation', dur);
            if (currentAnimation.current) {
                progress.value = progress.value;
                currentAnimation.current = null;
            }

            progress.value = withTiming(
                0,
                {
                    duration: dur,
                    easing: Easing.linear,
                },
                (finished) => {
                    currentAnimation.current = null;
                    if (finished && active) {
                        runOnJS(onEnd)(index + 1);
                    }
                }
            );
        },
        [active, index, onEnd]
    );

    // Update elapsed time during long press
    useEffect(() => {
        if (!progressWidth || !active) return;

        const updateElapsed = () => {
            longPressElapsedDuration.current = Math.abs((progress.value * duration) / progressWidth);
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
                overflow: 'hidden',
                marginRight: 8,
                backgroundColor: 'rgba(255,255,255,0.4)',
            }}>
            <Animated.View onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)} style={animatedStyle} />
        </View>
    );
};

export default StoryProgress;
