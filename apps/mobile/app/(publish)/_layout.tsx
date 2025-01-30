import { Stack } from "expo-router";

export default function PublishLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: true }} />
            <Stack.Screen name="caption" options={{ headerShown: true, presentation: 'modal' }} />
            <Stack.Screen name="expiration" options={{ headerShown: true, presentation: 'modal' }} />
        </Stack>
    )
}