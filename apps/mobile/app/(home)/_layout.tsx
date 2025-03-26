import { router, Tabs, usePathname } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { Home, UserCircle2 } from 'lucide-react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useNDKCurrentUser, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import { useAtomValue } from 'jotai';
import NewIcon from '@/components/icons/new';
import ReelIcon from '@/components/icons/reel';
import UserAvatar from '@/components/ui/user/avatar';
import { useMemo, useEffect } from 'react';
import WalletButton from '@/components/buttons/wallet';
import { useUserFlare } from '@/hooks/user-flare';
import { WALLET_ENABLED } from '@/utils/const';
import { scrollDirAtom } from '@/components/Feed/store';
import { ViewStyle } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';

export default function TabsLayout() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const scrollRef = useAtomValue(homeScreenScrollRefAtom);
    const tabBarAnim = useSharedValue(0);

    // Create a ref that we can safely pass to useScrollToTop
    const safeScrollRef = useMemo(() => {
        return scrollRef?.current ? { current: scrollRef.current } : null;
    }, [scrollRef]);

    // Only use useScrollToTop if we have a valid ref
    if (safeScrollRef) {
        useScrollToTop(safeScrollRef);
    }

    const scrollDir = useAtomValue(scrollDirAtom);

    // Use a worklet-friendly approach
    useEffect(() => {
        // Use withSpring for a more natural animation
        tabBarAnim.value = withSpring(scrollDir === 'up' ? 0 : 1, {
            damping: 20,
            stiffness: 200,
            mass: 0.5, // Add a bit less mass for faster response
        });
    }, [scrollDir]);

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
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    headerTintColor: colors.foreground,
                    headerTransparent: false,
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => <Home size={24} color={color} strokeWidth={focused ? 3 : 2} />,
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
                    tabBarIcon: ({ color, focused }) => <ReelIcon width={24} height={24} strokeWidth={focused ? 2.5 : 2} color={color} />,
                }}
            />

            <Tabs.Screen
                name="publish2"
                listeners={{
                    // tabPress: (e) => {
                    //     e.preventDefault();
                    //     if (!currentUser) {
                    //         router.push('/login');
                    //     } else {
                    //         newPost({ types: ['images', 'videos'] });
                    //     }
                    // },
                    tabPress: (e) => {
                        e?.preventDefault?.();
                        if (!currentUser) {
                            router.push('/login');
                        } else {
                            router.push('/publish');
                        }
                    },
                    tabLongPress: (e) => {
                        router.push('/story');
                    },
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color, focused }) => <NewIcon width={24} height={24} strokeWidth={2.5} color={color} />,
                }}
            />

            {WALLET_ENABLED ? (
                <Tabs.Screen
                    name="(wallet)"
                    options={{
                        title: 'Wallets',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => <WalletButton size={24} focused={focused} color={color} />,
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
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const userFlare = useUserFlare(currentUser?.pubkey);

    if (currentUser) {
        return (
            <UserAvatar
                pubkey={currentUser.pubkey}
                userProfile={userProfile}
                imageSize={size}
                flare={userFlare}
                canSkipBorder={true}
                borderWidth={1}
            />
        );
    }

    return <UserCircle2 size={size} color={colors.foreground} strokeWidth={2} />;
}
