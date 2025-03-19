import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Text } from './nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from './nativewindui/ActivityIndicator';
import { useEffect, useRef, useState } from 'react';
import { usePaymentStore } from '@/stores/payments';
import { NDKCacheAdapterSqlite, useNDK, useNDKCurrentUser, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useUsersStore } from '@/hooks/user-profile';
import { useUserFlareStore } from '@/hooks/user-flare';
import Animated, { useAnimatedStyle, withTiming, ZoomIn, runOnJS } from 'react-native-reanimated';
import { useAppSettingsStore } from '@/stores/app';

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
    const initPaymentStore = usePaymentStore((s) => s.init);
    const inset = useSafeAreaInsets();
    const haveInterval = useRef(false);
    const [ignoreWot, setIgnoreWot] = useState(true);
    const { ndk, logout } = useNDK();
    const [renderApp, setRenderApp] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const initUserProfileStore = useUsersStore((state) => state.init);
    const initUserFlareStore = useUserFlareStore((state) => state.init);
    useEffect(() => {
        initPaymentStore(currentUser?.pubkey);
    }, [currentUser?.pubkey]);
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const resetAppSettings = useAppSettingsStore((s) => s.reset);

    useEffect(() => {
        if (!userProfile?.name || !currentUser?.pubkey) return;

        if (userProfile.name === 'deleted-account') {
            alert('This account has been deleted. You need to create a new account to continue.');
            logout();
            resetAppSettings();
        }
    }, [currentUser?.pubkey, userProfile?.name]);

    useEffect(() => {
        if (!ndk?.cacheAdapter?.ready) {
            console.log('cache adapter not ready');
            return;
        }
        console.log('cache adapter ready');

        initUserProfileStore(ndk, (ndk.cacheAdapter as NDKCacheAdapterSqlite).db);
        initUserFlareStore();
    }, [ndk?.cacheAdapter?.ready]);

    useEffect(() => {
        if (appReady && wotReady) {
            setTimeout(() => {
                setRenderApp(true);
            }, 1000);
        }
    }, [appReady, wotReady]);

    if (appReady && !wotReady && !haveInterval.current) {
        haveInterval.current = true;
        setInterval(() => {
            setIgnoreWot(true);
        }, 3000);
    }

    const logo = require('../assets/logo.png');

    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: !renderApp
                ? withTiming(1, { duration: 300 })
                : withTiming(0, { duration: 300 }, (finished) => {
                      if (finished) {
                          runOnJS(setShouldRender)(false);
                      }
                  }),
        };
    }, [renderApp]);

    return (
        <>
            {shouldRender && (
                <Animated.View
                    style={[animatedStyles]}
                    className="absolute bottom-0 left-0 right-0 top-0 z-50 h-screen w-screen flex-1 items-center justify-center bg-card">
                    <Animated.Image source={logo} entering={ZoomIn} style={[{ width: 300, height: 100, objectFit: 'contain' }]} />

                    <Text variant="largeTitle" className="mt-4 text-5xl font-black">
                        Olas
                    </Text>
                    <Text variant="callout" className="font-medium opacity-40">
                        Make waves
                    </Text>

                    <View
                        className="absolute bottom-0 left-0 right-0 flex-col items-center gap-2 p-4"
                        style={{ paddingBottom: inset.bottom }}>
                        <ActivityIndicator size="small" color="#FF7F00" />

                        <Text variant="caption1" className="font-light">
                            <LoadingText appReady={appReady} wotReady={wotReady} />
                        </Text>
                    </View>
                </Animated.View>
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
