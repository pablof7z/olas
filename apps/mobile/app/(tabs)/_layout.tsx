import { router, Tabs } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { Home, PlaySquare, PlusSquare, UserCircle2 } from 'lucide-react-native';
import * as User from '@/components/ui/user';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useScrollToTop } from '@react-navigation/native';
import { useScroll } from '~/contexts/ScrollContext';

export default function HomeLayout() {
    const { currentUser } = useNDK();
    const { colors } = useColorScheme();
    const scrollRef = useScroll();

    // Hook to handle scroll to top
    useScrollToTop(scrollRef);

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.foreground,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
            }}>
            <Tabs.Screen
                name="(home)"
                options={{
                    headerTintColor: colors.foreground,
                    headerTransparent: false,
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollToOffset({ offset: 0, animated: true });
                        }
                    },
                }}
            />

            <Tabs.Screen
                name="publish2"
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        router.push('/publish');
                    },
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color, focused }) => <PlusSquare size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />,
                }}
            />

            <Tabs.Screen
                name="reels"
                options={{
                    title: 'Reels',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => <PlaySquare size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />,
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
                            <User.Profile pubkey={currentUser.pubkey}>
                                <User.Avatar alt="Profile image" className="h-6 w-6" />
                            </User.Profile>
                        ) : (
                            <UserCircle2 size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                        ),
                }}
            />
        </Tabs>
    );
}
