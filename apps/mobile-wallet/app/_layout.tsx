import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Inter-Regular': require('../assets/fonts/InterVariable.ttf'),
        'Inter-Medium': require('../assets/fonts/InterVariable.ttf'),
        'Inter-SemiBold': require('../assets/fonts/InterVariable.ttf'),
        'Inter-Bold': require('../assets/fonts/InterVariable.ttf'),
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: {
                            backgroundColor: '#121212',
                        },
                    }}
                >
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="create-account" options={{ headerShown: false }} />
                </Stack>
            </View>
        </GestureHandlerRootView>
    );
} 