import { Link, router, Tabs } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { Icon } from '@roninoss/icons';
import {
    BoltIcon,
    Home,
    Mic,
    PlaySquare,
    PlusSquare,
    Search,
    Speaker,
    SpeakerIcon,
    SquarePlay,
    UserCircle2,
    Wallet,
    Wallet2,
} from 'lucide-react-native';
import * as User from '@/ndk-expo/components/user';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useNDK } from '@/ndk-expo';
import { Text } from '@/components/nativewindui/Text';

export default function HomeLayout() {
    const { currentUser } = useNDK();
    const { colors } = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#000',
                tabBarInactiveTintColor: '#000',
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
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                    ),
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
                    tabBarIcon: ({ color, focused }) => (
                        <PlusSquare size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                    ),
                }}
            />

            <Tabs.Screen
                name="reels"
                options={{
                    title: 'Reels',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <PlaySquare size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
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
