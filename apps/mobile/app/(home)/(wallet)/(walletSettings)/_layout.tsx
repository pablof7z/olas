import { Stack } from 'expo-router';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen name="index" options={{ title: 'Wallet', headerShown: true }} />
            <Stack.Screen name="relays" options={{ title: 'Relays', headerShown: false }} />
            <Stack.Screen name="mints" options={{ title: 'Mints', headerShown: false }} />
            <Stack.Screen name="tokens" options={{ title: 'Coins', headerShown: false }} />
            <Stack.Screen name="nutzaps" options={{ title: 'Nutzaps', headerShown: false }} />
        </Stack>
    );
}
