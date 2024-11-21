import '../global.css';
import 'expo-dev-client';
import '@bacons/text-decoder/install';
import 'react-native-get-random-values';
import { PortalHost } from '@rn-primitives/portal';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { NDKCacheAdapterSqlite, useNDK } from '@/ndk-expo';
import { Link, router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import { NDKWalletProvider } from '@/ndk-expo/providers/wallet';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKProvider } from '~/ndk-expo';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@roninoss/icons';
import { NDKKind, NDKList, NDKRelay } from '@nostr-dev-kit/ndk';
import NDKSessionProvider from '@/ndk-expo/providers/session';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';

SplashScreen.preventAutoHideAsync();

function UnpublishedEventIndicator() {
    const { ndk, unpublishedEvents } = useNDK();

    if (unpublishedEvents.size === 0) return null;

    return (
        <Link href="/unpublished">
            <View className="flex-row items-center">
                <Icon name="archive-outline" />
                <View className="flex-row items-center gap-2 rounded-md bg-red-500 px-2 py-0.5">
                    <Text className="text-xs text-white">{unpublishedEvents.size}</Text>
                </View>
            </View>
        </Link>
    );
}

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
    const { colors } = useColorScheme();
    const { colorScheme, isDarkColorScheme } = useColorScheme(); 
    const netDebug = (msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
        const url = new URL(relay.url);
        if (direction === 'send') console.log('👉', url.hostname, msg);
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

    return (
        <>
            <StatusBar key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`} style={isDarkColorScheme ? 'light' : 'dark'} />
            <NDKProvider
                explicitRelayUrls={relays}
                cacheAdapter={new NDKCacheAdapterSqlite('olas')}
                clientName="olas"
                clientNip89="31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505">
                <NDKCacheCheck>
                    <NDKWalletProvider>
                        <NDKSessionProvider follows={true} kinds={new Map([[NDKKind.BlossomList, { wrapper: NDKList }]])}>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                                    {/* <NavThemeProvider value={NAV_THEME[colorScheme]}> */}
                                        <PortalHost />
                                        <Stack>
                                            <Stack.Screen
                                                name="login"
                                                options={{
                                                    headerShown: false,
                                                    presentation: 'modal',
                                                }}
                                            />

                                            <Stack.Screen
                                                name="publish/index"
                                                options={{
                                                    headerShown: true,
                                                    presentation: 'modal',
                                                }}
                                            />
                                            <Stack.Screen
                                                name="publish/caption"
                                                options={{
                                                    headerShown: true,
                                                    presentation: 'modal',
                                                }}
                                            />
                                            <Stack.Screen
                                                name="publish/expiration"
                                                options={{
                                                    headerShown: true,
                                                    presentation: 'modal',
                                                }}
                                            />

                                            <Stack.Screen
                                                name="(tabs)"
                                                options={{
                                                    headerShown: false,
                                                }}
                                            />

                                            <Stack.Screen
                                                name="profile"
                                                options={{
                                                    headerShown: false,
                                                    presentation: 'modal',
                                                }}
                                            />

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
                                    {/* </NavThemeProvider> */}
                                </KeyboardProvider>
                            </GestureHandlerRootView>
                        </NDKSessionProvider>
                    </NDKWalletProvider>
                </NDKCacheCheck>
            </NDKProvider>
        </>
    );
}
