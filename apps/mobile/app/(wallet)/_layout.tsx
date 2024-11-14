import { Link, router, Stack, Tabs } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import { useColorScheme } from "../../lib/useColorScheme";
import { Icon } from "@roninoss/icons";
import { cn } from "@/lib/cn";
import { Text } from "@/components/nativewindui/Text";
import { BackButton } from "@/components/BackButton";

export default function RootLayout() {
    const { colors } = useColorScheme();
    
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerTintColor: Platform.OS === 'ios' ? undefined : colors.foreground,
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="send" options={{ title: 'Send', presentation: 'modal' }} />
            <Stack.Screen name="receive" options={{ title: 'Receive', presentation: 'modal' }} />
            <Stack.Screen name="qrcode" options={{ title: 'QR Code', presentation: 'modal' }} />
            <Stack.Screen name="(settings)" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
    );
}
