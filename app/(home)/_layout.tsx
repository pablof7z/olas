import { ScrollYProvider, useScrollY } from '@/context/ScrollYContext';
import { useNDKCurrentPubkey, useNDKCurrentUser, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { useScrollToTop } from '@react-navigation/native';
import { Tabs, router, usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import { Home, UserCircle2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import {
    interpolate,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import WalletButton from '@/components/buttons/wallet';
import NewIcon from '@/components/icons/new';
import ReelIcon from '@/components/icons/reel';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUserFlare } from '@/lib/user/stores/flare';
import { WALLET_ENABLED } from '@/utils/const';
import UserAvatar from '@/lib/user/components/avatar';

export default function TabsLayout() {
    const currentPubkey = useNDKCurrentPubkey();
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

    // Use scrollY shared value to animate tabBar based on scroll direction
    // HomeScreen (index.tsx) should update scrollY as the user scrolls
    const scrollY = useScrollY();
    const prevScrollY = useRef(0);

    // Use a derived value to update tabBarAnim based on scroll direction
    // This runs on the UI thread
    useDerivedValue(() => {
        const current = scrollY.value;

        if (current < prevScrollY.current) {
            // Scrolling up
            tabBarAnim.value = withSpring(0, {
                damping: 20,
                stiffness: 200,
                mass: 0.5,
            });
        } else if (current > prevScrollY.current) {
            // Scrolling down
            tabBarAnim.value = withSpring(1, {
                damping: 20,
                stiffness: 200,
                mass: 0.5,
            });
        }
        prevScrollY.current = current;
    }, [scrollY, tabBarAnim]);

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
                        if (!currentPubkey) {
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
                        if (!currentPubkey) {
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
    const currentPubkey = useNDKCurrentPubkey();
    const { colors } = useColorScheme();
    const userProfile = useProfileValue(currentPubkey, { subOpts: { skipVerification: true } });
    const userFlare = useUserFlare(currentPubkey || undefined);

    if (currentPubkey) {
        return (
            <UserAvatar
                pubkey={currentPubkey}
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
