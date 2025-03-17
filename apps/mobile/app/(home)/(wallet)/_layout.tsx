import Lightning from '@/components/icons/lightning';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDKCurrentUser, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { Redirect, Stack } from 'expo-router';
import { Bolt, Calendar, PieChart, QrCode, SettingsIcon } from 'lucide-react-native';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const { activeWallet } = useNDKWallet();

    if (!currentUser) {
        return <Redirect href="/login" />;
    }

    if (!activeWallet) {
        return <Redirect href="/(home)/(settings)/wallets" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                contentStyle: {
                    backgroundColor: colors.card,
                },
            }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Wallet',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="(walletSettings)"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}
