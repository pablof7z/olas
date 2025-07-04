import '../global.css';
// import * as DevClient from 'expo-dev-client';
import '@bacons/text-decoder/install';
import { ScrollYProvider } from '@/context/ScrollYContext';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { NDKRelay } from '@nostr-dev-kit/ndk';
import { PortalHost } from '@rn-primitives/portal';
import { type ScreenProps, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useAtom, useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { ErrorBoundary } from '../components/error-boundary';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

import FeedTypeBottomSheet from '@/components/FeedType/BottomSheet';
import { type FeedType, feedTypeAtom } from '@/components/FeedType/store';
import LoaderScreen from '@/components/LoaderScreen';
import SessionMonitor from '@/components/SessionMonitor';
import { TagSelectorBottomSheet } from '@/components/TagSelectorBottomSheet';
import PostOptionsMenu from '@/components/events/Post/OptionsMenu';
import AppReady from '@/components/headless/AppReady';
import SignerReady from '@/components/headless/SignerReady';
import CommentsBottomSheet from '@/lib/comments/bottom-sheet';
import FeedEditorBottomSheet from '@/lib/feed-editor/bottom-sheet';
import { initializeNDK } from '@/lib/ndk';
import { ProductViewBottomSheet } from '@/lib/product-view/bottom-sheet';
import ReactionPickerBottomSheet from '@/lib/reaction-picker/bottom-sheet';
import UserBottomSheet from '@/lib/user-bottom-sheet/component';
import ZapperBottomSheet from '@/lib/zapper/bottom-sheet';
import { appReadyAtom, useAppSettingsStore } from '@/stores/app';
import { relayNoticesAtom } from '@/stores/relays';
import { DEV_BUILD, PUBLISH_ENABLED, blacklistPubkeys } from '@/utils/const';
import { NDKUser, useNDKInit, useNDKMutes } from '@nostr-dev-kit/ndk-hooks';
import { ReanimatedLogLevel, configureReanimatedLogger } from 'react-native-reanimated';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';

import ImageLoadingOverlay from '@/components/ImageLoadingOverlay';
// This is the default configuration
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false, // Reanimated runs in strict mode by default
});

// LogBox.ignoreAllLogs();

// DevClient?.closeMenu();

const ndk = initializeNDK();

const modalPresentation = (
    opts: ScreenProps['options'] = { headerShown: Platform.OS !== 'ios' }
): ScreenProps['options'] => {
    const presentation = Platform.OS === 'ios' ? 'modal' : undefined;
    const headerShown = Platform.OS !== 'ios';

    return { presentation, headerShown, ...opts };
};

export default function App() {
    const [appReady, setAppReady] = useAtom(appReadyAtom);
    const initializeNDK = useNDKInit();

    useEffect(() => {
        initializeNDK(ndk);
        setAppReady(true);
    }, []);

    return (
        <ErrorBoundary>
            <LoaderScreen appReady={appReady} wotReady>
                <SessionMonitor />
                <RootLayout />
            </LoaderScreen>
        </ErrorBoundary>
    );
}

export function RootLayout() {
    useInitialAndroidBarSync();
    const { isDarkColorScheme } = useColorScheme();

    const setRelayNotices = useSetAtom(relayNoticesAtom);
    const setFeedType = useSetAtom(feedTypeAtom);

    const addExtraMuteItems = useNDKMutes((s) => s.addExtraMuteItems);

    // Application-wide shared scrollY value
    const scrollY = useSharedValue(0);

    useEffect(() => {
        const users = Array.from(blacklistPubkeys).map((pubkey) => new NDKUser({ pubkey }));
        addExtraMuteItems(users);

        // DevClient?.hideMenu();
    }, []);

    useEffect(() => {
        const storedFeed = SecureStore.getItem('feed');
        let feedType: FeedType | null = null;
        if (storedFeed) {
            try {
                const payload = JSON.parse(storedFeed);
                feedType = payload;
            } catch (_e) {
                if (storedFeed.startsWith('#')) {
                    feedType = { kind: 'search', value: storedFeed };
                } else {
                    feedType = { kind: 'discover', value: storedFeed };
                }

                if ((feedType.kind as string) === 'hashtag' && feedType.value) {
                    feedType.hashtags = [feedType.value.slice(1, 999)];
                }
            }
        } else {
            feedType = { kind: 'discover', value: 'for-you' };
        }

        setFeedType(feedType);
    }, []);

    useEffect(() => {
        if (!ndk) return;
        ndk.pool.on('notice', (relay: NDKRelay | null, notice: string) => {
            if (relay?.url) {
                const url = relay.url; // Ensure url is a string
                setRelayNotices((prev) => ({
                    ...prev,
                    [url]: [...(prev[url] || []), notice],
                }));
            }
        });
    }, [ndk]);

    // initialize app settings
    const initAppSettings = useAppSettingsStore((state) => state.init);

    useEffect(() => {
        initAppSettings();
    }, []);

    return (
        <ScrollYProvider value={scrollY}>
            {ndk && <AppReady />}
            {ndk && <SignerReady />}
            <StatusBar
                key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
                style={isDarkColorScheme ? 'light' : 'dark'}
            />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                        <ActionSheetProvider>
                            <>
                                <PortalHost />
                                <Stack>
                                    <Stack.Screen name="login" />

                                    <Stack.Screen
                                        name="dlnwc"
                                        options={{ headerShown: false, presentation: 'modal' }}
                                    />

                                    <Stack.Screen name="publish" options={{ headerShown: false }} />

                                    <Stack.Screen
                                        name="(home)"
                                        options={{ headerShown: false, title: 'Home' }}
                                    />

                                    <Stack.Screen
                                        name="search"
                                        options={{ headerShown: true, title: 'Search' }}
                                    />

                                    <Stack.Screen
                                        name="groups/new"
                                        options={{ headerShown: false, presentation: 'modal' }}
                                    />

                                    <Stack.Screen name="profile" />
                                    <Stack.Screen
                                        name="notifications"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="communities"
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="tx"
                                        options={{ headerShown: false, presentation: 'modal' }}
                                    />
                                    <Stack.Screen name="365" />

                                    <Stack.Screen
                                        name="enable-wallet"
                                        options={{ headerShown: true, presentation: 'modal' }}
                                    />

                                    <Stack.Screen name="view" />
                                    <Stack.Screen name="eula" options={modalPresentation()} />

                                    <Stack.Screen name="stories" options={{ headerShown: false }} />
                                    <Stack.Screen name="story" options={{ headerShown: false }} />
                                    <Stack.Screen
                                        name="live"
                                        options={{ contentStyle: { backgroundColor: 'black' } }}
                                    />

                                    <Stack.Screen
                                        name="receive"
                                        options={{
                                            headerShown: true,
                                            presentation: 'modal',
                                            title: 'Receive',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="send"
                                        options={{
                                            headerShown: false,
                                            presentation: 'modal',
                                            title: 'Send',
                                        }}
                                    />
                                </Stack>
                                {/* {<ImageLoadingOverlay />} */}

                                <PostOptionsMenu />
                                <FeedTypeBottomSheet />
                                <TagSelectorBottomSheet />
                                <FeedEditorBottomSheet />
                                <UserBottomSheet />
                                <ReactionPickerBottomSheet />
                                <CommentsBottomSheet />
                                <ZapperBottomSheet />
                                <ProductViewBottomSheet />
                            </>
                        </ActionSheetProvider>
                        <Toasts />
                        <DevelopmentStatus />
                    </KeyboardProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
            {/* <ImageLoadingOverlay /> */}
        </ScrollYProvider>
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
