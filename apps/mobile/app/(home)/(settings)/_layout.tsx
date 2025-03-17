import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
export default function SettingsLayout() {
    const { colors } = useColorScheme();
    const bottomHeight = useBottomTabBarHeight();

    return (
        <Stack
            screenOptions={{
                title: 'Settings',
                headerShown: true,
                headerTintColor: Platform.OS === 'ios' ? undefined : colors.foreground,
                contentStyle: {
                    paddingBottom: bottomHeight,
                },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="content/index" />
            <Stack.Screen name="content/muted" />
            <Stack.Screen name="content/cache" />
            <Stack.Screen name="wallets" options={{ headerShown: false }} />
            <Stack.Screen name="nwc" options={{ headerShown: false }} />
            <Stack.Screen name="dev" />
            <Stack.Screen name="zaps" />
            <Stack.Screen name="delete-account" />
        </Stack>
    );
}
