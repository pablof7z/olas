import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import 'react-native-get-random-values';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { toast, Toasts } from '@backpackapp-io/react-native-toast';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import NDK, { NDKCacheAdapterSqlite, NDKEventWithFrom, NDKNutzap, useNDKCurrentUser, useNDKNutzapMonitor, useNDKCacheInitialized } from '@nostr-dev-kit/ndk-mobile';
import { ScreenProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKEvent, NDKKind, NDKList, NDKRelay, } from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { configurePushNotifications } from '~/lib/notifications';
import { useNDK, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
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
import { Platform, Pressable, View } from 'react-native';
import * as SettingsStore from 'expo-secure-store';
import { feedTypeAtom } from './(tabs)';
import { mainKinds } from '@/utils/const';
import { mountTagSelectorAtom, TagSelectorBottomSheet } from '@/components/TagSelectorBottomSheet';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk-mobile';
import { db, initialize } from "@/stores/db";
import NutzapMonitor from '@/components/cashu/nutzap-monitor';
import { useWalletMonitor } from '@/hooks/wallet';

initialize()

const sessionKinds = new Map([
    [NDKKind.BlossomList, { wrapper: NDKList }],
    [NDKKind.ImageCurationSet, { wrapper: NDKList }],
    [NDKKind.CashuWallet, { wrapper: NDKCashuWallet }],
    // [NDKKind.SimpleGroupList, { wrapper: NDKList }],
] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

const settingsStore = {
    get: SecureStore.getItemAsync,
    set: SecureStore.setItemAsync,
    delete: SecureStore.deleteItemAsync,
    getSync: SecureStore.getItem,
};

const netDebug = (msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
    const url = new URL(relay.url);
    if (direction === 'send' && relay.url.match(/olas/)) console.log('👉', url.hostname, msg.slice(0, 400));
    if (direction === 'recv' && relay.url.match(/olas/i)) console.log('👈', url.hostname, msg.slice(0, 400));
};

let timeSinceFirstRender = undefined;

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);
    const cacheInitialized = useNDKCacheInitialized();
    // const [wotReady, setWotReady] = useState(false);

    useInitialAndroidBarSync();
    const { colorScheme, isDarkColorScheme } = useColorScheme();

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
    
    const { ndk, init: initializeNDK } = useNDK() as { ndk: NDK, init: (opts: any) => void };
    const { init: initializeSession } = useNDKSession();
    const setRelayNotices = useSetAtom(relayNoticesAtom);
    const currentUser = useNDKCurrentUser();
    const timeoutRef = useRef(null);
    const setFeedType = useSetAtom(feedTypeAtom);

    // useEffect(() => { console.log('ndk changed', !!ndk, Date.now() - timeSinceFirstRender); }, [ndk])
    // useEffect(() => { console.log('initializeSession changed', !!initializeSession, Date.now() - timeSinceFirstRender); }, [initializeSession])
    // useEffect(() => { console.log('currentUser changed', !!currentUser, Date.now() - timeSinceFirstRender); }, [currentUser])
    
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

        const timeSinceLastAppSync = SecureStore.getItem('timeSinceLastAppSync');
        const sinceFilter = timeSinceLastAppSync ? { since: parseInt(timeSinceLastAppSync) } : {};

        const kindString = Array.from(mainKinds).map((k) => k.toString());

        const appSub = ndk.subscribe([
            { kinds: [NDKKind.Text], '#k': kindString, '#p': [currentUser.pubkey], ...sinceFilter },
            { kinds: [NDKKind.GenericReply], "#K": kindString, '#P': [currentUser.pubkey], ...sinceFilter },
            { kinds: [NDKKind.GenericReply], "#K": kindString, '#p': [currentUser.pubkey], ...sinceFilter },
            { kinds: [NDKKind.GenericRepost], '#k': kindString, '#p': [currentUser.pubkey], ...sinceFilter },
            { kinds: [NDKKind.Reaction], '#k': kindString, '#p': [currentUser.pubkey], ...sinceFilter },
            { kinds: [NDKKind.Nutzap], '#p': [currentUser.pubkey], ...sinceFilter },
                // { authors: [user.pubkey], limit: 100 },
        ], { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, groupable: false, skipVerification: true, subId: 'main-sub' }, undefined);
        let receivedEvents = 0;
        appSub.on('event', (event) => receivedEvents++);
        appSub.on('eose', () => {
            const time = Date.now()/1000;
            console.log('appSub eose, setting timeSinceLastAppSync to', time, {receivedEvents});
            SecureStore.setItem('timeSinceLastAppSync', time.toString());
        })
    }, [ndk, currentUser?.pubkey])

    useEffect(() => {
        if (!ndk) return;
        if (!appReady) {
                        setAppReady(true);
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }
    }, [ndk])

    useEffect(() => {
        if (appReady) return;

        if (!timeoutRef.current) {  
            timeoutRef.current = setTimeout(() => {
                if (!appReady) {
                    console.log("app wasn't ready, so timing out");
                    setAppReady(true);
                }
            }, 1000);
        }

        if (!ndk || !currentUser?.pubkey || !cacheInitialized) return;

        initializeSession(
            ndk,
            currentUser,
            settingsStore,
            {
                follows: { kinds: [NDKKind.Image, NDKKind.VerticalVideo] },
                muteList: true,
                wot: false,
                kinds: sessionKinds,
                subOpts: { skipVerification: true }
            },
            {
                onReady: () => {
                    console.log('onReady');
                    if (!appReady) {
                        setAppReady(true);
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }
                }
                // onWotReady: () => setWotReady(true),
            }
        );
    }, [ndk, currentUser?.pubkey, cacheInitialized, appReady])

    useEffect(() => {
        const currentUserInSettings = SecureStore.getItem('currentUser');

        initializeNDK({
            explicitRelayUrls: relays,
            cacheAdapter: new NDKCacheAdapterSqlite('olas'),
            enableOutboxModel: true,
            initialValidationRatio: 0.0,
            lowestValidationRatio: 0.0,
            netDebug,
            clientName: 'olas',
            clientNip89: '31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505',
            settingsStore,
        });

        if (!currentUserInSettings) {
            console.log('there was no current user in settings, so setting app ready');
            setAppReady(true);
            // setWotReady(true);
        } else {
            console.log('there was a current user in settings, so not setting app ready');
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

    const mountTagSelector = useAtomValue(mountTagSelectorAtom);

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

    if (!timeSinceFirstRender) timeSinceFirstRender = Date.now();
    // console.log('app layout rerender', Date.now() - timeSinceFirstRender);

    const modalPresentation = useCallback((opts: ScreenProps['options'] = { headerShown: Platform.OS !== 'ios' }): ScreenProps['options'] => {
        const presentation = Platform.OS === 'ios' ? 'modal' : undefined;
        const headerShown = Platform.OS !== 'ios';

        return { presentation, headerShown, ...opts }
    }, [])

    useWalletMonitor();

    // useEffect(() => { console.log('modalPresentation changed', !!modalPresentation, Date.now() - timeSinceFirstRender); }, [modalPresentation])

    return (
        <>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <LoaderScreen appReady={appReady} wotReady={true}>
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

                                    <Stack.Screen name="profile" options={modalPresentation({ headerShown: false })} />
                                    <Stack.Screen name="notifications" options={{ headerShown: false }} />
                                    {/* <Stack.Screen name="communities" options={{ headerShown: false }} /> */}
                                    <Stack.Screen name="tx" options={{ headerShown: false, presentation: 'modal' }} />

                                    <Stack.Screen name="enable-wallet" options={{ headerShown: true, presentation: 'modal' }} />
                                    <Stack.Screen name="comments" options={modalPresentation({ title: 'Comments' })} />
                                    <Stack.Screen name="365" options={{ headerShown: true, title: '#olas365' }} />

                                    <Stack.Screen name="view" options={{
                                            contentStyle: { backgroundColor: 'black' },
                                            presentation: 'modal',
                                            headerShown: false,
                                        }}
                                    />

                                    <Stack.Screen name="live" options={{
                                            contentStyle: { backgroundColor: 'black' },
                                        }}
                                    />

                                    <Stack.Screen
                                        name="(wallet)"
                                        options={modalPresentation({
                                            title: "Wallet",
                                            headerShown: false,
                                        })}
                                    />
                                    
                                    <Stack.Screen name="receive" options={{ headerShown: true, presentation: 'modal', title: 'Receive' }} />
                                    <Stack.Screen name="send" options={{ headerShown: false, presentation: 'modal', title: 'Send' }} />
                                </Stack>

                                <PostOptionsMenu />
                                <PostTypeBottomSheet />
                                <LocationBottomSheet />
                                {/* <CommunityBottomSheet /> */}
                                <AlbumsBottomSheet />
                                <PostTypeSelectorBottomSheet />
                                
                                <HandleNotificationPrompt />
                                <TagSelectorBottomSheet />
                                <PostTypeSelectorBottomSheet />
                            </NavThemeProvider>
                            <Toasts />
                        </KeyboardProvider>
                    </LoaderScreen>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </>
    );
}

function HandleNotificationPrompt() {
    const promptedForNotifications = useAppSettingsStore(state => state.promptedForNotifications);
    
    if (!promptedForNotifications) return <PromptForNotifications />;
}
