import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import 'react-native-get-random-values';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { toast, Toasts } from '@backpackapp-io/react-native-toast';
import { Text } from "@/components/nativewindui/Text";

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import NDK, { NDKCacheAdapterSqlite, NDKEventWithFrom, NDKNutzap, useNDKCacheInitialized, useNDKCurrentUser, useNDKNutzapMonitor, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKEvent, NDKKind, NDKList, NDKRelay, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { configurePushNotifications } from '~/lib/notifications';
import { useNDK, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useSetAtom } from 'jotai';
import LoaderScreen from '@/components/LoaderScreen';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { relayNoticesAtom } from '@/stores/relays';
import { useAppSettingsStore } from '@/stores/app';
import { AlbumsBottomSheet } from '@/components/NewPost/AlbumsBottomSheet';
import { PostTypeBottomSheet } from '@/components/NewPost/PostTypeBottomSheet';
import { LocationBottomSheet } from '@/components/NewPost/LocationBottomSheet';
import { PromptForNotifications } from './notification-prompt';
import PostTypeSelectorBottomSheet from '@/components/NewPost/TypeSelectorBottomSheet';
import PostOptionsMenu from '@/components/events/Post/OptionsMenu';
import { Pressable } from 'react-native';
import * as SettingsStore from 'expo-secure-store';
import { feedTypeAtom } from './(tabs)/(home)';
import { CommunityBottomSheet } from '@/components/NewPost/CommunityBottomSheet';

const mainKinds = [NDKKind.Image, NDKKind.HorizontalVideo, NDKKind.VerticalVideo];

const sessionKinds = new Map([
    [NDKKind.BlossomList, { wrapper: NDKList }],
    [NDKKind.ImageCurationSet, { wrapper: NDKList }],
    [NDKKind.CashuWallet, { wrapper: NDKCashuWallet }],
    [NDKKind.SimpleGroupList, { wrapper: NDKList }],
    [967],
] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

const sessionFilters = (user: NDKUser) => [
    { kinds: [NDKKind.GenericReply], '#K': mainKinds.map((k) => k.toString()), '#p': [user.pubkey] },
    { kinds: [NDKKind.GenericRepost], '#k': mainKinds.map((k) => k.toString()), '#p': [user.pubkey] },
    { authors: [user.pubkey] },
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
        // if (direction === 'recv' && msg.match(/EOSE/)) console.log('👈', url.hostname, msg.slice(0, 400));
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
        relays.push('wss://relay.primal.net/');
    }

    // check if we have relay.olas.app, if not, add it
    if (!relays.find((r) => r.match(/^relay\.olas\.app/))) {
        relays.unshift('wss://relay.olas.app/');
    }

    if (!relays.find((r) => r.match(/^purplepag\.es/))) {
        relays.unshift('wss://purplepag.es/');
    }
    
    // relays = [ 'ws://localhost:2929' ];

    const { ndk, init: initializeNDK } = useNDK();
    const { init: initializeSession } = useNDKSession();
    const [relayNotices, setRelayNotices] = useAtom(relayNoticesAtom);
    const currentUser = useNDKCurrentUser();
    const timeoutRef = useRef(null);
    const setFeedType = useSetAtom(feedTypeAtom);
    
    useEffect(() => {
        const storedFeed = SettingsStore.getItem('feed');
        if (storedFeed) setFeedType(storedFeed);
    }, [])

    useEffect(() => {
        if (ndk) ndk.connect();
    }, [ndk])

    useEffect(() => {
        if (!ndk || !currentUser?.pubkey) return;
        if (ndk && timeoutRef.current) return;

        initializeSession(
            ndk,
            currentUser,
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

        timeoutRef.current = setTimeout(() => setAppReady(true), 1500);
    }, [ndk, currentUser?.pubkey])

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
        });

        if (!currentUserInSettings) {
            setAppReady(true);
            setWotReady(true);
        }
    }, []);

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
        initAppSettings();
        
        // Configure push notifications
        configurePushNotifications();
        
        // Notification received while app is running
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        // Notification tapped by user
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            // Here you can handle notification taps
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, []);

    const promptedForNotifications = useAppSettingsStore(state => state.promptedForNotifications);

    const { setActiveWallet } = useNDKWallet();
    const unlinkWallet = useCallback(() => {
        setActiveWallet(null);
        router.push('/(tabs)/(settings)/wallets');
    }, [setActiveWallet])

    return (
        <>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <LoaderScreen appReady={appReady} wotReady={wotReady}>
                        <NutzapMonitor />
                        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                            <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                <PortalHost />
                                <Stack>
                                    <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />

                                    <Stack.Screen name="notification-prompt" options={{ headerShown: false, presentation: 'modal' }} />

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
                                    <Stack.Screen name="communities" options={{ headerShown: false }} />
                                    <Stack.Screen name="tx" options={{ headerShown: false, presentation: 'modal' }} />

                                    <Stack.Screen name="enable-wallet" options={{ headerShown: true, presentation: 'modal' }} />
                                    <Stack.Screen name="comments" options={{ headerShown: false, presentation: 'modal' }} />
                                    <Stack.Screen name="365" options={{ headerShown: true, title: '#olas365' }} />

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
                                            title: "Wallet",
                                            presentation: 'modal',
                                            headerRight: () => (
                                                <Pressable onPress={unlinkWallet}>
                                                    <Text className="text-red-500">Unlink</Text>
                                                </Pressable>
                                            )
                                        }} />
                                    
                                    <Stack.Screen name="receive" options={{ headerShown: true, presentation: 'modal', title: 'Receive' }} />
                                    <Stack.Screen name="send" options={{ headerShown: false, presentation: 'modal', title: 'Send' }} />
                                </Stack>

                                <PostOptionsMenu />
                                <PostTypeBottomSheet />
                                <LocationBottomSheet />
                                <CommunityBottomSheet />
                                <AlbumsBottomSheet />
                                <PostTypeSelectorBottomSheet />
                                
                                {appReady &&!promptedForNotifications && <PromptForNotifications />}
                            </NavThemeProvider>
                            <Toasts />
                        </KeyboardProvider>
                    </LoaderScreen>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </>
    );
}

function NutzapMonitor() {
    const { nutzapMonitor } = useNDKNutzapMonitor();
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
}
