import { NDKEvent, NDKKind, useNDK, useNDKSession, useNDKSessionEvents } from '@nostr-dev-kit/ndk-mobile';
import { Icon } from '@roninoss/icons';
import { useMemo, useState } from 'react';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKRelay, NDKRelayStatus } from '@nostr-dev-kit/ndk-mobile';
import * as SecureStore from 'expo-secure-store';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { TextField } from '@/components/nativewindui/TextField';
import { View } from 'react-native';
import { NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';

export default function NwcScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKSession();
    const [relays, setRelays] = useState<NDKRelay[]>(Array.from(ndk!.pool.relays.values()));
    const [url, setUrl] = useState('');

    console.log('activeWallet', !!activeWallet);

    const addFn = () => {
        console.log({ url });
        try {
            const uri = new URL(url);
            if (!['wss:', 'ws:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            const relay = ndk?.addExplicitRelay(url);
            if (relay) setRelays([...relays, relay]);
            setUrl('');
        } catch (e) {
            alert('Invalid URL');
        }
    };

    async function save() {
        const nwc = new NDKNWCWallet(ndk);
        await nwc.initWithPairingCode(connectString);

        await nwc.updateBalance();
        console.log('nwc', nwc.balance());

        setActiveWallet(nwc);
        
        SecureStore.setItemAsync('nwc', connectString);
        router.back();
    }

    const [connectString, setConnectString] = useState('');

    return (
        <View className="flex-1 flex-col">
            <LargeTitleHeader
                title={`Nostr Wallet Connect`}
                rightView={() => (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                )}
            />

            <Text className="text-center text-muted-foreground">
                Enter your nostr wallet connect url.
            </Text>

            <View className="px-4">
                <TextField
                    autoFocus
                    keyboardType="default"
                    className="w-full h-96 bg-card rounded-lg"
                    value={connectString}
                    onChangeText={setConnectString}
                />
            </View>
        </View>
    );
}
