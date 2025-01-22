import { router, Tabs } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { Home, Search, UserCircle2 } from 'lucide-react-native';
import * as User from '@/components/ui/user';
import { useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useScrollToTop } from '@react-navigation/native';
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { homeScreenScrollRefAtom } from '@/atoms/homeScreen';
import { useAtomValue } from 'jotai';
import NewIcon from '@/components/icons/new';
import ReelIcon from '@/components/icons/reel';
import { usePostTypeSelectorBottomSheet } from '@/components/NewPost/TypeSelectorBottomSheet/hook';
import { useNewPost } from '@/hooks/useNewPost';
import { postTypeSelectorSheetRefAtom } from '@/components/NewPost/TypeSelectorBottomSheet/store';
import { Platform } from 'react-native';

export default function TabsLayout() {
    const currentUser = useNDKCurrentUser();
    const { colors } = useColorScheme();
    const scrollRef = useAtomValue(homeScreenScrollRefAtom);
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const postTypeSelectorSheetRef = useAtomValue(postTypeSelectorSheetRefAtom);

    // Hook to handle scroll to top
    useScrollToTop(scrollRef);

    const newPost = useNewPost();

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
                name="search"
                options={{
                    headerShown: false,
                    title: 'Search',
                    tabBarIcon: ({ color, focused }) => <Search size={24} color={color} strokeWidth={2.5} />,
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
                            if (postTypeSelectorSheetRef.current) {
                                postTypeSelectorSheetRef.current.present();
                            } else {
                                newPost({ types: ['images', 'videos'] });
                            }
                        }
                    },
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color, focused }) => (
                        <NewIcon width={24} height={24} strokeWidth={2.5} style={{ color: color }} />
                    ),
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
                name="(settings)"
                listeners={{
                    tabPress: (e) => {
                        if (!currentUser) {
                            e.preventDefault();
                            router.push('/login');
                        }
                    },
                }}
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) =>
                        currentUser ? (
                            <User.Avatar userProfile={userProfile} size={16} className="h-6 w-6 rounded-full" />
                        ) : (
                            <UserCircle2 size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                        ),
                }}
            />
        </Tabs>
    );
}
