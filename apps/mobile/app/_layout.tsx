import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { StyleSheet } from 'react-native';
import UserBottomSheet from '@/lib/user-bottom-sheet/component';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import {
    NDKEventWithFrom,
    useNDKCurrentUser, useNDKInit,
    NDKUser
} from '@nostr-dev-kit/ndk-mobile';
import { ScreenProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKKind, NDKList } from '@nostr-dev-kit/ndk-mobile';
import React, { useEffect, useRef, useState } from 'react';
import { useNDKSessionInit } from '@nostr-dev-kit/ndk-mobile';
import { useSetAtom } from 'jotai';
import LoaderScreen from '@/components/LoaderScreen';
import { relayNoticesAtom } from '@/stores/relays';
import { useAppSettingsStore } from '@/stores/app';
import { PromptForNotifications } from './notification-prompt';
import PostOptionsMenu from '@/components/events/Post/OptionsMenu';
import { Platform, View } from 'react-native';
import * as SettingsStore from 'expo-secure-store';
import { FeedType, feedTypeAtom } from '@/components/FeedType/store';
import { COMMUNITIES_ENABLED, DEV_BUILD, PUBLISH_ENABLED } from '@/utils/const';
import { TagSelectorBottomSheet } from '@/components/TagSelectorBottomSheet';
import { useNutzapMonitor, useWalletMonitor } from '@/hooks/wallet';
import FeedTypeBottomSheet from '@/components/FeedType/BottomSheet';
import { LocationBottomSheet } from '@/lib/post-editor/sheets/LocationBottomSheet';
import FeedEditorBottomSheet from '@/lib/feed-editor/bottom-sheet';
import { CommunityBottomSheet } from '@/lib/post-editor/sheets/CommunityBottomSheet';
import ReactionPickerBottomSheet from '@/lib/reaction-picker/bottom-sheet';
import { initializeNDK } from '@/lib/ndk';
import { settingsStore } from '@/lib/settings-store';
import ZapperBottomSheet from '@/lib/zapper/bottom-sheet';
import { ProductViewBottomSheet } from '@/lib/product-view/bottom-sheet';
import CommentsBottomSheet from '@/lib/comments/bottom-sheet';
import { useAppSub } from '@/hooks/app-sub';

// LogBox.ignoreAllLogs();

const currentUserInSettings = SecureStore.getItem('currentUser') ?? undefined;
const ndk = initializeNDK(currentUserInSettings);

const sessionKinds = new Map([
    [NDKKind.BlossomList, { wrapper: NDKList }],
    [NDKKind.SimpleGroupList, { wrapper: NDKList }],
] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

const modalPresentation = (opts: ScreenProps['options'] = { headerShown: Platform.OS !== 'ios' }): ScreenProps['options'] => {
    const presentation = Platform.OS === 'ios' ? 'modal' : undefined;
    const headerShown = Platform.OS !== 'ios';

    return { presentation, headerShown, ...opts };
}



export default function RootLayout() {
    const [appReady, setAppReady] = useState(!!currentUserInSettings);
    // const [wotReady, setWotReady] = useState(false);

    useInitialAndroidBarSync();
    const { colorScheme, isDarkColorScheme } = useColorScheme();

    // // check if we have relay.olas.app, if not, add it
    // if (!relays.find((r) => r.match(/^relay\.olas\.app/))) {
    //     relays.unshift('wss://relay.olas.app/');
    // }

    // if (!relays.find((r) => r.match(/^purplepag\.es/))) {
    //     relays.unshift('wss://purplepag.es/');
    // }

    useNDKInit(ndk, settingsStore);

    const initializeSession = useNDKSessionInit();
    const setRelayNotices = useSetAtom(relayNoticesAtom);
    const currentUser = useNDKCurrentUser();
    const timeoutRef = useRef(null);
    const setFeedType = useSetAtom(feedTypeAtom);

    useEffect(() => {
        const storedFeed = SettingsStore.getItem('feed');
        let feedType: FeedType | null = null;
        if (storedFeed) {
            try {
                const payload = JSON.parse(storedFeed);
                feedType = payload;
            } catch (e) {
                if (storedFeed.startsWith('#')) {
                    feedType = { kind: 'search', value: storedFeed };
                } else {
                    feedType = { kind: 'discover', value: storedFeed };
                }

                if (feedType.kind as string === 'hashtag' && feedType.value) {
                    feedType.hashtags = [feedType.value.slice(1, 999)];
                }
            }
        } else {
            feedType = { kind: 'discover', value: 'for-you' };
        }

        setFeedType(feedType);
    }, []);

    useAppSub(currentUser?.pubkey, [(!ndk || !currentUser?.pubkey || !appReady), currentUser?.pubkey]);

    useEffect(() => {
        if (!currentUser?.pubkey) return;

        initializeSession(
            ndk,
            currentUser,
            settingsStore,
            {
                follows: { kinds: [NDKKind.Image, NDKKind.VerticalVideo] },
                muteList: true,
                wot: false,
                kinds: sessionKinds,
                filters: (user: NDKUser) => [
                    {
                        kinds: [
                            NDKKind.CashuMintList,
                            NDKKind.CashuWallet,
                        ],
                        authors: [user.pubkey],
                    },
                ],
                subOpts: { wrap: true, skipVerification: true },
            },
            {
                onReady: () => {
                    if (!appReady) {
                        console.log('setting app ready in onReady');
                        setAppReady(true);
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }
                },
                // onWotReady: () => setWotReady(true),
            }
        );
    }, [currentUser?.pubkey]);

    useEffect(() => {
        if (!currentUserInSettings) {
            console.log('there was no current user in settings, so setting app ready');
            setAppReady(true);
            // setWotReady(true);
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
        // configurePushNotifications();

        // Notification received while app is running
        // const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        //     console.log('Notification received:', notification);
        // });

        // // Notification tapped by user
        // const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        //     console.log('Notification response:', response);
        //     // Here you can handle notification taps
        // });

        // return () => {
        //     Notifications.removeNotificationSubscription(notificationListener);
        //     Notifications.removeNotificationSubscription(responseListener);
        // };
    }, []);

    useWalletMonitor();
    useNutzapMonitor();

    return (
        <>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <LoaderScreen appReady={appReady} wotReady={true}>
                        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                            <ActionSheetProvider>
                                <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                    <PortalHost />
                                    <Stack>
                                        <Stack.Screen name="login" />

                                        <Stack.Screen name="notification-prompt" options={{ headerShown: false, presentation: 'modal' }} />

                                        <Stack.Screen name="dlnwc" options={{ headerShown: false, presentation: 'modal' }} />

                                        <Stack.Screen name="(publish)" options={{ headerShown: false }} />

                                        <Stack.Screen name="(home)" options={{ headerShown: false, title: 'Home' }} />

                                        <Stack.Screen name="search" options={{ headerShown: true, title: 'Search' }} />

                                        <Stack.Screen name="groups/new" options={{ headerShown: false, presentation: 'modal' }} />

                                        <Stack.Screen name="profile" />
                                        <Stack.Screen name="notifications" options={{ headerShown: false }} />
                                        <Stack.Screen name="communities" options={{ headerShown: false }} />
                                        <Stack.Screen name="tx" options={{ headerShown: false, presentation: 'modal' }} />
                                        <Stack.Screen name="365" />

                                        <Stack.Screen name="enable-wallet" options={{ headerShown: true, presentation: 'modal' }} />

                                        <Stack.Screen name="view" />
                                        <Stack.Screen name="eula" options={modalPresentation()} />

                                        <Stack.Screen name="story" options={{ headerShown: false }} />
                                        <Stack.Screen name="live" options={{ contentStyle: { backgroundColor: 'black' } }}
                                        />

                                        <Stack.Screen
                                            name="receive"
                                            options={{ headerShown: true, presentation: 'modal', title: 'Receive' }}
                                        />
                                        <Stack.Screen name="send" options={{ headerShown: false, presentation: 'modal', title: 'Send' }} />
                                    </Stack>
                                    
                                <PostOptionsMenu />
                                <LocationBottomSheet />
                                {COMMUNITIES_ENABLED && <CommunityBottomSheet />}
                                {/* <AlbumsBottomSheet /> */}
                                {/* <PostTypeSelectorBottomSheet /> */}
                                <FeedTypeBottomSheet />
                                {/* <HandleNotificationPrompt /> */}
                                <TagSelectorBottomSheet />
                                <FeedEditorBottomSheet />
                                <UserBottomSheet />
                                <ReactionPickerBottomSheet />
                                <CommentsBottomSheet />
                                <ZapperBottomSheet />
                                <ProductViewBottomSheet />
                            </NavThemeProvider>
                            </ActionSheetProvider>
                            <Toasts />
                            <DevelopmentStatus />
                        </KeyboardProvider>
                    </LoaderScreen>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </>
    );
}

function DevelopmentStatus() {
    if (!DEV_BUILD) return null;

    return (
        <View style={styles.developmentStatus}>
            <View style={styles.developmentStatusIndicator} />
        </View>
    );
}

const styles = StyleSheet.create({
    developmentStatus: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    developmentStatusIndicator: {
        width: 6,
        height: 6,
        backgroundColor: PUBLISH_ENABLED ? 'green' : 'red',
        borderRadius: 100,
        zIndex: 1000,
    },
});

function HandleNotificationPrompt() {
    const promptedForNotifications = useAppSettingsStore((state) => state.promptedForNotifications);

    if (!promptedForNotifications) return <PromptForNotifications />;
}
