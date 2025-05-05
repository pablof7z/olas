import type React from 'react';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    type SharedValue,
} from 'react-native-reanimated';
import useProfileTabs from '../hooks/useProfileTabs';
import ProfileTabs from './ProfileTabs';

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 100;
const TAB_BAR_HEIGHT = 48;

type StickyProfileTabsProps = {
    scrollY: SharedValue<number>;
    hasProducts: boolean;
    colors: Record<string, string>;
};

const StickyProfileTabs: React.FC<StickyProfileTabsProps> = ({ scrollY, hasProducts, colors }) => {
    const [view, setView] = useProfileTabs();

    // Stick to top after header collapses
    const stickyTabsAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
            [HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT, 0],
            Extrapolate.CLAMP
        );
        return { transform: [{ translateY }] };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    flexDirection: 'row',
                    alignContent: 'flex-end',
                    left: 0,
                    right: 0,
                    top: HEADER_MIN_HEIGHT,
                    height: TAB_BAR_HEIGHT,
                    paddingTop: 14,
                    zIndex: 10,
                },
                stickyTabsAnimatedStyle,
            ]}
        >
            <ProfileTabs view={view} setView={setView} hasProducts={hasProducts} colors={colors} />
        </Animated.View>
    );
};

export default StickyProfileTabs;
