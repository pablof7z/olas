import { useNDKCurrentUser, useProfile } from '@nostr-dev-kit/ndk-mobile';
import { useScrollToTop } from '@react-navigation/native';
import { Tabs, router, usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import { Home, UserCircle2 } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import { scrollDirAtom } from '@/components/Feed/store';
import WalletButton from '@/components/buttons/wallet';
import NewIcon from '@/components/icons/new';
import ReelIcon from '@/components/icons/reel';
import UserAvatar from '@/components/ui/user/avatar';
import { useUserFlare } from '@/hooks/user-flare';
import { useColorScheme } from '@/lib/useColorScheme';
import { WALLET_ENABLED } from '@/utils/const';

export default function TabsLayout() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const scrollRef = useAtomValue(homeScreenScrollRefAtom);
    const tabBarAnim = useSharedValue(0);

    // Create a ref that's always defined but may point to null
    const safeScrollRef = useMemo(
        () => ({
            current: scrollRef?.current || null,
        }),
        [scrollRef]
    );

    useScrollToTop(safeScrollRef);

    const scrollDir = useAtomValue(scrollDirAtom);

    // Use a worklet-friendly approach
    useEffect(() => {
        // Use withSpring for a more natural animation
        tabBarAnim.value = withSpring(scrollDir === 'up' ? 0 : 1, {
            damping: 20,
            stiffness: 200,
            mass: 0.5, // Add a bit less mass for faster response
        });
    }, [scrollDir, tabBarAnim]);

    const isReels = usePathname() === '/reels';

    // Create animated style using Reanimated
    const animatedTabBarStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(tabBarAnim.value, [0, 1], [0, 100]),
                },
            ],
        };
    });

    const screenOptions = useMemo(() => {
        const baseStyle: ViewStyle = {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
        };

        if (isReels) {
            return {
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: 'white',
                tabBarStyle: [baseStyle, { backgroundColor: 'black' }, animatedTabBarStyle],
            };
        } else {
            return {
                tabBarActiveTintColor: colors.foreground,
                tabBarInactiveTintColor: colors.foreground,
                tabBarStyle: [baseStyle, { backgroundColor: colors.card }, animatedTabBarStyle],
            };
        }
    }, [isReels, colors, animatedTabBarStyle]);

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarShowLabel: false,
                ...screenOptions,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    headerTintColor: colors.foreground,
                    headerTransparent: false,
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={24} color={color} strokeWidth={focused ? 3 : 2} />
                    ),
                }}
                listeners={
                    {
                        // tabPress: (e) => {
                        //     if (scrollRef.current) {
                        //         scrollRef.current.scrollToOffset({ offset: 0, animated: true });
                        //     }
                        // },
                    }
                }
            />

            <Tabs.Screen
                name="reels"
                options={{
                    title: 'Reels',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <ReelIcon
                            width={24}
                            height={24}
                            strokeWidth={focused ? 2.5 : 2}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="publish2"
                listeners={{
                    tabPress: (e) => {
                        e?.preventDefault?.();
                        if (!currentUser) {
                            router.push('/login');
                        } else {
                            router.push('/publish');
                        }
                    },
                    tabLongPress: () => router.push('/story'),
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color }) => (
                        <NewIcon width={24} height={24} strokeWidth={2.5} color={color} />
                    ),
                }}
            />

            {WALLET_ENABLED ? (
                <Tabs.Screen
                    name="(wallet)"
                    options={{
                        title: 'Wallets',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <WalletButton size={24} focused={focused} color={color} />
                        ),
                    }}
                />
            ) : null}

            <Tabs.Screen
                name="(settings)"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => <UserButton size={24} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        if (!currentUser) {
                            router.push('/login');
                        } else {
                            router.push('/(home)/(settings)');
                        }
                    },
                }}
            />
        </Tabs>
    );
}

function UserButton({ size = 32 }: { size?: number }) {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const userProfile = useProfile(currentUser?.pubkey);
    const userFlare = useUserFlare(currentUser?.pubkey);

    if (currentUser) {
        return (
            <UserAvatar
                pubkey={currentUser.pubkey}
                userProfile={userProfile}
                imageSize={size}
                flare={userFlare}
                canSkipBorder
                borderWidth={1}
            />
        );
    }

    return <UserCircle2 size={size} color={colors.foreground} strokeWidth={2} />;
}
