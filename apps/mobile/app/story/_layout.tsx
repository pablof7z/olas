import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function StoryLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'black' },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="selector" />
            <Stack.Screen name="preview" />
        </Stack>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});
