import { useScrollY } from '@/context/ScrollYContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
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
    const scrollY = useScrollY();
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();

    const { user, userProfile, content, flare, followCount, hasProducts } = useProfileData(pubkey);
    const [currentView, setView] = useProfileTabs();

    // Set initial tab if provided in route
    useEffect(() => {
        if (view) {
            setView(view);
        }
    }, [view, setView]);

    // Reset scroll position when navigating to a new profile
    useEffect(() => {
        scrollY.value = 0;
    }, [pubkey, scrollY]);

    const containerStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            flex: 1,
            backgroundColor: colors.card,
            position: 'relative', // Needed for absolute sticky tabs
        }),
        [colors.card]
    );

    if (!user || !pubkey) return null;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => (
                        <Header
                            user={user}
                            pubkey={pubkey}
                            userProfile={userProfile}
                            scrollY={scrollY}
                        />
                    ),
                }}
            />
            <View style={containerStyle}>
                <ProfileHeader
                    pubkey={pubkey}
                    userProfile={userProfile}
                    flare={flare}
                    colors={colors}
                    followCount={followCount}
                    scrollY={scrollY}
                    insets={insets}
                />
                {/* Sticky ProfileTabs */}
                <StickyProfileTabs scrollY={scrollY} hasProducts={hasProducts} colors={colors} />
                <View style={{ flex: 1, marginTop: TAB_BAR_HEIGHT }}>
                    <ProfileContent
                        pubkey={pubkey}
                        hasProducts={hasProducts}
                        scrollY={scrollY}
                        colors={colors}
                    />
                </View>
            </View>
        </>
    );
}