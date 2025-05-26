import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { type StyleProp, View, type ViewStyle, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useProfileData from '../hooks/useProfileData';
import useProfileTabs from '../hooks/useProfileTabs';

import { useColorScheme } from '@/lib/useColorScheme';

import Header from '../components/Header';
import ProfileContent from '../components/ProfileContent';
import ProfileHeader from '../components/ProfileHeader';
import StickyProfileTabs from '../components/StickyProfileTabs';

const TAB_BAR_HEIGHT = 48;

export default function Profile() {
    const { pubkey, view } = useLocalSearchParams() as { pubkey: string; view?: string };
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();

    const { user, userProfile, followCount, hasProducts } = useProfileData(pubkey);
    const [currentView, setView] = useProfileTabs();

    // Toggle state for header expansion (scroll-based)
    const [isExpanded, setIsExpanded] = useState(true);
    const lastState = React.useRef(true);

    // Scroll threshold logic: only toggle when crossing 100px up/down
    const handleScrollYChange = useCallback((y: number) => {
        if (y > 100 && lastState.current) {
            setIsExpanded(false);
            lastState.current = false;
        } else if (y <= 100 && !lastState.current) {
            setIsExpanded(true);
            lastState.current = true;
        }
    }, []);

    // Set initial tab if provided in route
    useEffect(() => {
        if (view) {
            setView(view);
        }
    }, []);

    const containerStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            flex: 1,
            backgroundColor: colors.card,
            position: 'relative', // Needed for absolute sticky tabs
        }),
        [colors.card]
    );

    const header = useMemo(() => <Header user={user} pubkey={pubkey} userProfile={userProfile} isExpanded={isExpanded} />,
        [user, pubkey, userProfile, isExpanded]
    );
    
    if (!user || !pubkey) return null;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => header
                }}
            />
            <View style={containerStyle}>
                <ProfileHeader
                    pubkey={pubkey}
                    userProfile={userProfile}
                    colors={colors}
                    followCount={followCount}
                    isExpanded={isExpanded}
                    insets={insets}
                />
                <StickyProfileTabs isExpanded={isExpanded} hasProducts={hasProducts} colors={colors} />
                <View style={{ flex: 1, marginTop: TAB_BAR_HEIGHT }}>
                    <ProfileContent
                        pubkey={pubkey}
                        hasProducts={hasProducts}
                        colors={colors}
                        onScrollYChange={handleScrollYChange}
                    />
                </View>
            </View>
        </>
    );
}
