import { Link, router, Tabs } from 'expo-router'
import { useColorScheme } from '@/lib/useColorScheme';
import { Icon } from '@roninoss/icons';
import { Home, Mic, PlusSquare, Search, Speaker, SpeakerIcon, SquarePlay, UserCircle, UserCircle2, Video } from "lucide-react-native";
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useNDK } from '@/ndk-expo';

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
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarBackground: () => (
                    <BlurView 
                        intensity={50} 
                        tint="light" 
                        style={{ flex: 1 }}
                    />
                ),
            }}>
            <Tabs.Screen
                name="(home)"
                options={{
                    headerTintColor: colors.foreground,
                    headerTransparent: false,
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                    )
                }}
            />

            <Tabs.Screen
                name="publish2"
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        router.push('/publish');
                    }
                }}
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color, focused }) => (
                        <PlusSquare size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                    )
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
                    }
                }}
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <UserCircle size={24} color={color} strokeWidth={focused ? 2.5 : 1.5} />
                    )
                }}
            />
        </Tabs>
    )
}
