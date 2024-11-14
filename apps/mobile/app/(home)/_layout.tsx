import { Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useColorScheme } from '@/lib/useColorScheme';
import { Icon } from '@roninoss/icons';
import { View } from 'react-native';

export default function HomeLayout() {
    const { colors } = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="home" size={24} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="(publish)"
                options={{
                    title: 'Publish',
                    tabBarIcon: ({ color }) => (
                        <View className="bg-pink-500 rounded-full p-2 mb-4">
                            <Icon name="plus-box" size={24} color={colors.background} />
                        </View>
                    )
                }}
            />
            
            <Tabs.Screen
                name="(settings)"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="settings" size={24} color={color} />
                    )
                }}
            />
        </Tabs>
    )
}
