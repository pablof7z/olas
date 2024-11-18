import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';

export default function SettingsLayout() {
    const { colors } = useColorScheme();

    return (
        <Stack
            screenOptions={{
                animation: 'ios',
                title: 'Settings',
                headerShown: true,
                headerTintColor:
                    Platform.OS === 'ios' ? undefined : colors.foreground,
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen
                name="wallet/index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="wallet/relays"
                options={{ headerShown: true }}
            />
            <Stack.Screen name="wallet/mints" options={{ headerShown: true }} />
        </Stack>
    );
}
