import { View } from 'react-native';
import { Text } from './nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from './nativewindui/ActivityIndicator';
import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { usePaymentStore } from '@/stores/payments';
import { NDKCacheAdapterSqlite, useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useUsersStore } from '@/hooks/user-profile';
import { useUserFlareStore } from '@/hooks/user-flare';

export default function LoaderScreen({
    children,
    appReady,
    wotReady,
}: {
    children: React.ReactNode;
    appReady: boolean;
    wotReady: boolean;
}) {
    const currentUser = useNDKCurrentUser();
    const initPaymentStore = usePaymentStore(s => s.init);
    const inset = useSafeAreaInsets();
    // const haveInterval = useRef(false);
    // const [ignoreWot, setIgnoreWot] = useState(true);
    const { ndk } = useNDK();
    const [renderApp, setRenderApp] = useState(false);
    const initUserProfileStore = useUsersStore((state) => state.init);
    const initUserFlareStore = useUserFlareStore((state) => state.init);
    useEffect(() => {
        initPaymentStore(currentUser?.pubkey);
    }, [currentUser?.pubkey])

    useEffect(() => {
        if (!ndk) return;

        initUserProfileStore(ndk, (ndk.cacheAdapter as NDKCacheAdapterSqlite).db);
        initUserFlareStore();
    }, [!!ndk])

    useEffect(() => {
        if (appReady && (wotReady)) {
            setTimeout(() => {
                setRenderApp(true);
            }, 1000);
        }
    }, [appReady, wotReady]);

    // if (appReady && !wotReady && !haveInterval.current) {
    //     haveInterval.current = true;
    //     setInterval(() => {
    //         setIgnoreWot(true);
    //     }, 3000);
    // }

    const logo = require('../assets/logo.png');

    return (
        <>
            {!renderApp && (
                <View className="h-screen w-screen flex-1 items-center justify-center bg-card absolute top-0 left-0 right-0 bottom-0 z-50">
                    <Image source={logo} style={{ width: 300, height: 100, objectFit: 'contain' }} />

                    <Text variant="largeTitle" className="mt-4 text-5xl font-black">
                        Olas
                    </Text>
                    <Text variant="callout" className="font-medium opacity-40">
                        Make waves
                    </Text>

                    <View className="absolute bottom-0 left-0 right-0 flex-col items-center gap-2 p-4" style={{ paddingBottom: inset.bottom }}>
                        <ActivityIndicator size="small" color="#FF7F00" />

                        <Text variant="caption1" className="font-light">
                            <LoadingText appReady={appReady} wotReady={wotReady} />
                        </Text>
                    </View>
                </View>
            )}
        {appReady && children}
        </>
    );
}

function LoadingText({ appReady, wotReady }: { appReady: boolean; wotReady: boolean }) {
    if (!appReady) {
        return 'Loading Olas';
    }

    if (!wotReady) {
        return 'Loading web-of-trust...';
    }

    return 'Ready';
}
