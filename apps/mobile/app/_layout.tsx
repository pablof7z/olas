import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import 'react-native-get-random-values';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { toast, Toasts } from '@backpackapp-io/react-native-toast';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import NDK, { NDKCacheAdapterSqlite, NDKEventWithFrom, NDKNutzap, useNDKCacheInitialized } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKKind, NDKList, NDKRelay } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKUser } from '../../../packages/ndk/ndk/dist';
import { atom, useAtom, useSetAtom } from 'jotai';
import LoaderScreen from '@/components/LoaderScreen';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { relayNoticesAtom } from '@/stores/relays';
import { useAppSettingsStore } from '@/stores/app';
import { AlbumsBottomSheet } from '@/components/NewPost/AlbumsBottomSheet';
import { PostTypeBottomSheet } from '@/components/NewPost/PostTypeBottomSheet';
import { LocationBottomSheet } from '@/components/NewPost/LocationBottomSheet';

const mainKinds = [NDKKind.Image, NDKKind.HorizontalVideo, NDKKind.VerticalVideo];

const sessionKinds = new Map([
    [NDKKind.BlossomList, { wrapper: NDKList }],
    [NDKKind.ImageCurationSet, { wrapper: NDKList }],
    [NDKKind.CashuWallet, { wrapper: NDKCashuWallet }],
    [967],
] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

const sessionFilters = (user: NDKUser) => [
    { kinds: [NDKKind.GenericReply], '#K': mainKinds.map((k) => k.toString()), '#p': [user.pubkey] },
    { kinds: [NDKKind.GenericRepost], '#k': mainKinds.map((k) => k.toString()), '#p': [user.pubkey] },
];

const settingsStore = {
    get: SecureStore.getItemAsync,
    set: SecureStore.setItemAsync,
    delete: SecureStore.deleteItemAsync,
    getSync: SecureStore.getItem,
};

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);
    const [wotReady, setWotReady] = useState(false);

    useInitialAndroidBarSync();
    const { colorScheme, isDarkColorScheme } = useColorScheme();
    const netDebug = (msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
        const url = new URL(relay.url);
        if (direction === 'send') console.log('👉', url.hostname, msg.slice(0, 400));
        // if (direction === 'recv') console.log('👈', url.hostname, msg.slice(0, 400));
    };

    let relays = (SecureStore.getItem('relays') || '').split(',');

    relays = relays.filter((r) => {
        try {
            return new URL(r).protocol.startsWith('ws');
        } catch (e) {
            return false;
        }
    });

    if (relays.length === 0) {
        relays.push('wss://relay.primal.net');
        relays.push('wss://relay.damus.io');
    }

    // relays.push('wss://promenade.fiatjaf.com/');
    // check if we have relay.olas.app, if not, add it
    if (!relays.find((r) => r.match(/^relay\.olas\.app/))) {
        relays.unshift('wss://relay.olas.app');
    }

    const { init: initializeNDK } = useNDK();
    const { init: initializeSession } = useNDKSession();
    const [relayNotices, setRelayNotices] = useAtom(relayNoticesAtom);

    const onUserSet = useCallback(
        (ndk: NDK, user: NDKUser) => {
            initializeSession(
                ndk,
                user,
                settingsStore,
                {
                    follows: true,
                    muteList: true,
                    wot: false,
                    kinds: sessionKinds,
                    filters: sessionFilters,
                },
                {
                    onReady: () => setAppReady(true),
                    onWotReady: () => setWotReady(true),
                }
            );
        },
        [initializeSession]
    );

    useEffect(() => {
        const currentUserInSettings = SecureStore.getItem('currentUser');

        initializeNDK({
            explicitRelayUrls: relays,
            cacheAdapter: new NDKCacheAdapterSqlite('olas'),
            enableOutboxModel: true,
            initialValidationRatio: 0.0,
            lowestValidationRatio: 0.0,
            // netDebug,
            clientName: 'olas',
            clientNip89: '31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505',
            settingsStore,
            onUserSet,
        });

        if (!currentUserInSettings) {
            setAppReady(true);
            setWotReady(true);
        }
    }, []);

    const { ndk } = useNDK();
    useEffect(() => {
        if (!ndk) return;
        ndk.pool.on('notice', (relay, notice) => {
            console.log('⚠️ NOTICE', notice, relay?.url);
            setRelayNotices((prev) => ({
                ...prev,
                [relay?.url]: [...(prev[relay?.url] || []), notice],
            }));
        });
    }, [ndk]);

    // initialize app settings
    const initAppSettings = useAppSettingsStore((state) => state.init);
    useEffect(() => {
        console.log('initAppSettings');
        initAppSettings();
    }, []);

    return (
        <>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <LoaderScreen appReady={appReady} wotReady={wotReady}>
                        {/* <NutzapMonitor /> */}
                        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                            <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                <PortalHost />
                                <Stack screenOptions={{}}>
                                    <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />

                                    <Stack.Screen name="publish/index" options={{ headerShown: true, title: 'Publish' }} />
                                    <Stack.Screen name="publish/caption" options={{ headerShown: true, presentation: 'modal' }} />
                                    <Stack.Screen name="publish/expiration" options={{ headerShown: true, presentation: 'modal' }} />
                                    <Stack.Screen
                                        name="(tabs)"
                                        options={{
                                            headerShown: false,
                                            title: 'Home',
                                        }}
                                    />

                                    <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'modal' }} />
                                    <Stack.Screen name="notifications" options={{ headerShown: false }} />

                                    <Stack.Screen
                                        name="comments"
                                        options={{
                                            headerShown: false,
                                            presentation: 'modal',
                                        }}
                                    />

                                    <Stack.Screen
                                        name="view"
                                        options={{
                                            headerShown: false,
                                            presentation: 'modal',
                                        }}
                                    />

                                    <Stack.Screen
                                        name="(wallet)"
                                        options={{
                                            headerShown: false,
                                            presentation: 'modal',
                                        }}></Stack.Screen>
                                </Stack>

                                <PostTypeBottomSheet />
                                <LocationBottomSheet />
                                <AlbumsBottomSheet />
                            </NavThemeProvider>
                            <Toasts />
                        </KeyboardProvider>
                    </LoaderScreen>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </>
    );
}

{
    /* function NutzapMonitor() {
    const { nutzapMonitor } = useNDKSession();
    const connected = useRef(false);

    if (!nutzapMonitor) return null;
    if (connected.current) {
        return null;
    }

    connected.current = true;

    nutzapMonitor.on("seen", (event) => {
        console.log("seen", JSON.stringify(event.rawEvent(), null, 4));
        console.log(`https://njump.me/${event.encode()}`)
        // toast.success("Received a nutzap for " + event.amount + " " + event.unit);
    });
    nutzapMonitor.on("redeem", (event) => {
        const nutzap = NDKNutzap.from(event);
        toast.success("Redeemed a nutzap for " + nutzap.amount + " " + nutzap.unit);
    });
} */
}
