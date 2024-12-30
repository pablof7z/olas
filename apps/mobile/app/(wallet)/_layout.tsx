import { Stack } from 'expo-router';

export default function WalletLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="receive" />
        </Stack>
    );
}
