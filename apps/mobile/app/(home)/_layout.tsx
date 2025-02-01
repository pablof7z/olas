import { router, Tabs } from 'expo-router';
import Lightning from '@/components/icons/lightning';
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

export default function TabsLayout() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const scrollRef = useAtomValue(homeScreenScrollRefAtom);

    const openPickerIfEmpty = usePostEditorStore(s => s.openPickerIfEmpty);

    // Hook to handle scroll to top
    useScrollToTop(scrollRef);

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.foreground,
                tabBarInactiveTintColor: colors.muted,
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
                        <ReelIcon width={24} height={24} strokeWidth={focused ? 2.5 : 2} style={{ color: color }} />
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
                        <NewIcon width={24} height={24} strokeWidth={2.5} style={{ color }} />
                    ),
                }}
            />

            <Tabs.Screen
                name="(wallet)"
                options={{
                    title: 'Wallets',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <Lightning width={24} height={24} strokeWidth={focused ? 2.5 : 2} fill={"transparent"}  stroke={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="(settings)"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <UserButton />
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


function UserButton() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const { userProfile } = useUserProfile(currentUser?.pubkey);

    
    if (currentUser) {
        return <UserAvatar pubkey={currentUser.pubkey} userProfile={userProfile} imageSize={24} />
    }
    
    return (
        <UserCircle2 size={24} color={colors.foreground} strokeWidth={2} />
    )
}
