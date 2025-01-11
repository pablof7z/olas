import { useColorScheme } from "@/lib/useColorScheme";
import { useNDKCurrentUser, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { Redirect, Tabs } from "expo-router";
import { Bolt, Calendar, PieChart, QrCode, SettingsIcon } from "lucide-react-native";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const { activeWallet } = useNDKWallet();

    if (!currentUser) {
        return <Redirect href="/login" />
    }

    if (!activeWallet) {
        return <Redirect href="/(tabs)/(settings)/wallets" />
    }
    
    return (
        <Tabs screenOptions={{
            headerShown: true,
            tabBarShowLabel: true,
            tabBarActiveTintColor: colors.foreground,
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Wallet',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <Bolt size={24} color={focused ? colors.foreground : colors.muted} />
                }}
            />

            <Tabs.Screen
                name="scan"
                options={{
                    title: 'Scan',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <QrCode size={24} color={focused ? colors.foreground : colors.muted} />,
                }}
            />

            <Tabs.Screen
                name="(walletSettings)"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <SettingsIcon size={24} color={focused ? colors.foreground : colors.muted} />
                }}
            />
        </Tabs>
    )
}