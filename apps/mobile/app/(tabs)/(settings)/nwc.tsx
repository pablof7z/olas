import { NDKEvent, NDKKind, NDKRelay, useNDK, useNDKSession, useNDKSessionEvents, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useState } from 'react';
import { Text } from '~/components/nativewindui/Text';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router, Stack } from 'expo-router';
import { TextField } from '@/components/nativewindui/TextField';
import { View } from 'react-native';
import { NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';

export default function NwcScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const [status, setStatus] = useState<string | null>(null);

    async function save() {
        setStatus("Connecting");
        const nwc = new NDKNWCWallet(ndk);
        console.log('NWC init', connectString)

        nwc.pool.on('relay:connect', (r: NDKRelay) => console.log('connected to', r.url))

        nwc.once('ready', async () => {
            setStatus("Getting balance")
            try {
                await nwc.updateBalance();
                setActiveWallet(nwc);
                router.back();  
            } catch (e) {
                setStatus(e.message);
                setTimeout(() => setStatus(null), 4000);
            }
        });
        
        try {
            await nwc.initWithPairingCode(connectString);
            console.log('done')
        } catch (e) {console.error(e)}
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
