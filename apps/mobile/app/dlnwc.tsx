import { router, useGlobalSearchParams, usePathname, useUnstableGlobalHref } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NDKNWCGetInfoResult, NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { NDKRelay, useNDK, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { Button } from '@/components/nativewindui/Button';
import { Image } from 'react-native';
import { useAppSettingsStore } from '@/stores/app';
export default function NWCDeepLinkScreen() {
    const result = useGlobalSearchParams();
    const value = result?.value as string;
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const [info, setInfo] = useState<NDKNWCGetInfoResult | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

    const secret = result?.secret;

    let nwcUri = value?.replace(' ', '+');
    nwcUri += `&secret=${secret}`;

    const { ndk } = useNDK();

    useEffect(() => {
        console.log('nwcUri', nwcUri);
        const wallet = new NDKNWCWallet(ndk, { pairingCode: nwcUri });

        wallet.pool.on('relay:connect', (r: NDKRelay) => console.log('connected to', r.url));

        wallet.once('ready', async () => {
            setInfo(await wallet.getInfo());

            try {
                await wallet.updateBalance();
                setActiveWallet(wallet);
                setState('ready');
            } catch (e) {
                console.error('ready callback', e);
                setState('error');
            }
        });
    }, [nwcUri]);

    return (
        <View
            className={`flex-1 items-center justify-center ${state === 'ready' ? 'bg-green-500' : 'bg-card'} gap-6 p-4 transition-colors duration-500`}>
            <Image source={require('../assets/primal.png')} className="mx-2.5 h-24 w-24 rounded-lg" />

            {state === 'loading' && <ActivityIndicator size="large" />}
            {state === 'error' && <Text>Error</Text>}
            {state === 'ready' && (
                <Text variant="title1" className="text-white">
                    Wallet Connected!
                </Text>
            )}

            <Button
                className="mt-16 w-full bg-foreground"
                size="lg"
                variant="primary"
                onPress={() => {
                    router.replace('/');
                }}>
                <Text className="py-2 text-lg font-bold text-background">
                    {state === 'loading' ? 'Loading...' : state === 'error' ? 'Retry' : 'Continue'}
                </Text>
            </Button>
        </View>
    );
}
