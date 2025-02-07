import { NDKEvent, NDKKind, NDKRelay, useNDK, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Text } from '~/components/nativewindui/Text';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router, Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { TextField } from '@/components/nativewindui/TextField';
import { View } from 'react-native';
import { NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';

export default function NwcScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const [status, setStatus] = useState<string | null>(null);
    const timeout = useRef<NodeJS.Timeout | null>(null);

    const tryToGetBalance = useCallback((nwc: NDKNWCWallet) => {
        timeout.current = setTimeout(() => {
            setStatus("Didn't receive a response from the wallet -- will try again");
            setTimeout(() => setStatus("Retrying..."), 2000);
            tryToGetBalance(nwc);
        }, 10000);
        
        nwc.updateBalance().then(() => {
            if (timeout.current) clearTimeout(timeout.current);
            setActiveWallet(nwc);
            router.back();
        }).catch((e) => {
            console.error('error updating balance', e)
            if (timeout.current) clearTimeout(timeout.current);
            setStatus(e.message);
            setTimeout(() => setStatus(null), 4000);
        })
    }, [])

    async function save() {
        setStatus("Connecting");
        const nwc = new NDKNWCWallet(ndk, { pairingCode: connectString });
        nwc.pool.on('relay:connect', (r: NDKRelay) => console.log('connected to', r.url))

        nwc.once('ready', async () => {
            setStatus("Getting balance")
            tryToGetBalance(nwc);
        });
    }

    const [connectString, setConnectString] = useState('');

    return (
        <>
        <Stack.Screen options={{
            headerShown: true,
            title: `Nostr Wallet Connect`,
            headerRight: () => (
                !status ? (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                ) : (
                    <ActivityIndicator />
                )
            )
        }} />
        <View className="flex-1 flex-col justify-center">
            <Text className="text-center text-muted-foreground">Enter your nostr wallet connect url.</Text>
            <View className="px-4">
                {status && (
                    <Text>{status}</Text>
                )}
                <TextField
                    autoFocus
                    keyboardType="default"
                    className="min-h-[100px] w-full rounded-lg bg-card"
                    value={connectString}
                    multiline={true}
                    onChangeText={setConnectString}
                />
            </View>
        </View>
        </>
    );
}
