import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';

export default function SettingsLayout() {
    const { colors } = useColorScheme();

    return (
        <Stack
            screenOptions={{
                title: 'Settings',
                headerShown: true,
                headerTintColor: Platform.OS === 'ios' ? undefined : colors.foreground,
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="wallets" options={{ headerShown: false }} />
            <Stack.Screen name="nwc" options={{ headerShown: false, }} />
        </Stack>
    );
}
