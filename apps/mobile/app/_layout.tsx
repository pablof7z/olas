import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import 'react-native-get-random-values';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { NDKCacheAdapterSqlite, NDKEventWithFrom, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { Link, router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View, Platform } from 'react-native';
import { Button } from '@/components/nativewindui/Button';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKProvider } from '@nostr-dev-kit/ndk-mobile';
import { Text } from '@/components/nativewindui/Text';
import { NDKKind, NDKList, NDKRelay } from '@nostr-dev-kit/ndk-mobile';
import { NDKWalletProvider, NDKSessionProvider } from '@nostr-dev-kit/ndk-mobile';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { ScrollProvider } from '~/contexts/ScrollContext';

SplashScreen.preventAutoHideAsync();

function NDKCacheCheck({ children }: { children: React.ReactNode }) {
    const { ndk, cacheInitialized } = useNDK();

    console.log('cacheInitialized', { cacheInitialized });

    if (cacheInitialized === false) {
        return (
            <View className="flex-1 flex-col items-center justify-center gap-4">
                <Text>Initializing cache...</Text>

                <ActivityIndicator />
            </View>
        );
    } else if (cacheInitialized === true) {
        SplashScreen.hideAsync();
        return <>{children}</>;
    }
}

export default function RootLayout() {
    useInitialAndroidBarSync();
    const { colorScheme, isDarkColorScheme } = useColorScheme();
    const netDebug = (msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
        const url = new URL(relay.url);
        if (direction === 'send') console.log('👉', url.hostname, msg);
        if (direction === 'recv') console.log('👈', url.hostname, msg);
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

    relays.push('wss://promenade.fiatjaf.com/');

    const sessionKinds = new Map([
        [NDKKind.BlossomList, { wrapper: NDKList }],
        [NDKKind.ImageCurationSet, { wrapper: NDKList }],
        [967],
    ] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

    return (
        <ScrollProvider>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <NDKProvider
                explicitRelayUrls={relays}
                cacheAdapter={new NDKCacheAdapterSqlite('olas')}
                clientName="olas"
                clientNip89="31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505">
                <NDKCacheCheck>
                    <NDKWalletProvider>
                        <NDKSessionProvider follows={true} kinds={sessionKinds}>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                                    <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                        <PortalHost />
                                        <Stack screenOptions={{}}>
                                            <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />

                                            <Stack.Screen name="publish/index" options={{ headerShown: true, title: 'Publish' }} />
                                            <Stack.Screen name="publish/caption" options={{ headerShown: true, presentation: 'modal' }} />
                                            <Stack.Screen
                                                name="publish/expiration"
                                                options={{ headerShown: true, presentation: 'modal' }}
                                            />
                                            <Stack.Screen name="publish/type" options={{ headerShown: true, presentation: 'modal' }} />

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
                                                name="comment"
                                                options={{
                                                    headerShown: false,
                                                    presentation: 'modal',
                                                    title: 'Comment',
                                                }}
                                            />

                                            <Stack.Screen
                                                name="comments"
                                                options={{
                                                    headerShown: true,
                                                    presentation: 'modal',
                                                    title: '',
                                                    headerRight: () => (
                                                        <View className="flex-row items-center gap-2">
                                                            <Button variant="plain" onPress={() => router.push('/comment')}>
                                                                <Text className="text-primary">New Comment</Text>
                                                            </Button>
                                                        </View>
                                                    ),
                                                }}
                                            />

                                            <Stack.Screen
                                                name="view"
                                                options={{
                                                    headerShown: false,
                                                    presentation: 'modal',
                                                }}
                                            />
                                        </Stack>
                                    </NavThemeProvider>
                                </KeyboardProvider>
                            </GestureHandlerRootView>
                        </NDKSessionProvider>
                    </NDKWalletProvider>
                </NDKCacheCheck>
            </NDKProvider>
        </ScrollProvider>
    );
}
