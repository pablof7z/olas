import type React from 'react';
import Animated from 'react-native-reanimated';
import useProfileTabs from '../hooks/useProfileTabs';
import ProfileTabs from './ProfileTabs';


type StickyProfileTabsProps = {
    isExpanded: boolean;
    hasProducts: boolean;
    colors: Record<string, string>;
};

import { useSharedValue, useAnimatedStyle, interpolate, Extrapolate, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 110;
const TAB_BAR_HEIGHT = 48;

const StickyProfileTabs: React.FC<StickyProfileTabsProps> = ({ isExpanded, hasProducts, colors }) => {
    const [view, setView] = useProfileTabs();

    // Animation value: 1 = expanded, 0 = compact
    const anim = useSharedValue(isExpanded ? 1 : 0);

    useEffect(() => {
        anim.value = withTiming(isExpanded ? 1 : 0, { duration: 350 });
    }, [isExpanded, anim]);

    // Stick to top after header collapses/expands
    const stickyTabsAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            anim.value,
            [0, 1],
            [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
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
