import { router, Tabs, usePathname } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { Home, Search, UserCircle2, WalletIcon } from 'lucide-react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useNDKCurrentUser, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import { useAtomValue } from 'jotai';
import NewIcon from '@/components/icons/new';
import ReelIcon from '@/components/icons/reel';
import UserAvatar from '@/components/ui/user/avatar';
import { usePostEditorStore } from '@/lib/post-editor/store';
import { useMemo, useRef, useEffect } from 'react';
import WalletButton from '@/components/buttons/wallet';
import { useUserFlare } from '@/hooks/user-flare';
import { WALLET_ENABLED } from '@/utils/const';
import { Button } from '@/components/nativewindui/Button';
import { scrollDirAtom } from '@/components/Feed/store';
import { Animated, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabsLayout() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const scrollRef = useAtomValue(homeScreenScrollRefAtom);
    const tabBarAnim = useRef(new Animated.Value(0)).current;

    const openPickerIfEmpty = usePostEditorStore(s => s.openPickerIfEmpty);

    // Hook to handle scroll to top
    useScrollToTop(scrollRef);

    const scrollDir = useAtomValue(scrollDirAtom);

    useEffect(() => {
        Animated.timing(tabBarAnim, {
            toValue: scrollDir === 'up' ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [scrollDir]);

    const isReels = usePathname() === '/reels';
    const screenOptions = useMemo(() => {
        const commonStyle: ViewStyle = {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{
                translateY: tabBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 100]
                })
            }],
        };

        if (isReels) {
            return {
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: 'white',
                tabBarStyle: {
                    ...commonStyle,
                    backgroundColor: 'black',
                }
            }
        } else {
            return {
                tabBarActiveTintColor: colors.foreground,
                tabBarInactiveTintColor: colors.foreground,
                tabBarStyle: {
                    ...commonStyle,
                    backgroundColor: colors.card,
                }
            }
        }
    }, [isReels, colors, tabBarAnim]);

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarShowLabel: false,
                ...screenOptions
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    headerTintColor: colors.foreground,
                    headerTransparent: false,
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => <Home size={24} color={color} strokeWidth={2.5} />,
                }}
                listeners={{
                    // tabPress: (e) => {
                    //     if (scrollRef.current) {
                    //         scrollRef.current.scrollToOffset({ offset: 0, animated: true });
                    //     }
                    // },
                }}
            />

            <Tabs.Screen
                name="reels"
                options={{
                    title: 'Reels',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <ReelIcon width={24} height={24} strokeWidth={focused ? 2.5 : 2} color={color} />
                    ),
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
                            openPickerIfEmpty();
                            router.push('/(publish)');
                        }
                    },
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color, focused }) => (
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
                    tabBarIcon: ({ color, focused }) => (
                        <UserButton size={24} />
                    )
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        if (!currentUser) {
                            router.push('/login');
                        } else {
                            router.push('/(home)/(settings)');
                        }
                    }
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
        return <UserAvatar pubkey={currentUser.pubkey} userProfile={userProfile} imageSize={size} flare={userFlare} canSkipBorder={true} borderWidth={1} />
    }
    
    return (
        <UserCircle2 size={size} color={colors.foreground} strokeWidth={2} />
    )
}
