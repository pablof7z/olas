import { Stack } from 'expo-router';

export default function PublishLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="post/edit" options={{ headerShown: false }} />
            <Stack.Screen name="post/metadata" options={{ headerShown: false }} />
        </Stack>
    );
}

