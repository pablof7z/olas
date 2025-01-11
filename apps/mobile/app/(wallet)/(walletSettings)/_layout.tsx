import { Stack } from "expo-router";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="relays" options={{ headerShown: true, presentation: 'modal' }} />
            <Stack.Screen name="mints" options={{ headerShown: true, presentation: 'modal' }} />
        </Stack>
    )
}
