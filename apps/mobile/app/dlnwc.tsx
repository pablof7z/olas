import { router, useGlobalSearchParams, usePathname, useUnstableGlobalHref } from "expo-router";
import { Text } from "@/components/nativewindui/Text";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";
import { NDKNWCGetInfoResult, NDKNWCWallet } from "@nostr-dev-kit/ndk-wallet";
import { NDKRelay, useNDK, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { Button } from "@/components/nativewindui/Button";
import { Image } from "react-native";

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
        const wallet = new NDKNWCWallet(ndk);

        wallet.pool.on('relay:connect', (r: NDKRelay) => console.log('connected to', r.url))

        wallet.once('ready', async () => {
            console.log('NWC wallet ready')

            setInfo(await wallet.getInfo());
            
            try {
                await wallet.updateBalance();
                setActiveWallet(wallet);
                setState('ready');
            } catch (e) {
                console.error('ready callback', e)
                setState('error');
            }
        });
        
        wallet.initWithPairingCode(nwcUri)
            .then(() => {
                console.log('NWC wallet initialized')
                wallet.updateBalance()
                    .then(() => {
                        console.log('NWC wallet balance updated', wallet.balance)
                    })
                    .catch((err) => {
                        console.error('NWC wallet balance update error', err)
                    })
            })
            .catch((err) => {
                console.error('NWC wallet initialization error', err)
            })
    }, [nwcUri])
    
    return (
        <View className={`flex-1 items-center justify-center ${state === 'ready' ? 'bg-green-500' : 'bg-card'} transition-colors duration-500 gap-6 p-4`}>
            <Image source={require('../assets/primal.png')} className="mx-2.5 w-24 h-24 rounded-lg" />
            
            {state === 'loading' && <ActivityIndicator size="large" />}
            {state === 'error' && <Text>Error</Text>}
            {state === 'ready' && <Text variant="title1" className="text-white">
                Wallet Connected!
            </Text>}
            
            <Button className="w-full bg-foreground mt-16" size="lg" variant="primary" onPress={() => {
                router.replace('/');
            }}>
                <Text className="text-lg font-bold py-2">
                    {state === 'loading' ? 'Loading...' : state === 'error' ? 'Retry' : 'Continue'}
                </Text>
            </Button>
        </View>
    )
}