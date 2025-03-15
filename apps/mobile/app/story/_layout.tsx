import { StickerProvider } from '@/lib/new-story-editor/StickerContext';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function StoryLayout() {
    return (
        <StickerProvider>
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
        </StickerProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});
