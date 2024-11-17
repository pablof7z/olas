import '../global.css';
import 'expo-dev-client';
import "@bacons/text-decoder/install";
import "react-native-get-random-values";
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { NDKCacheAdapterSqlite, useNDK } from "@/ndk-expo";
import { Link, router, Stack, Tabs, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';  
import { Platform, View, SafeAreaView, Pressable, TouchableOpacity } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import { NDKWalletProvider } from '@/ndk-expo/providers/wallet';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKProvider } from '~/ndk-expo';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@roninoss/icons';
import { NDKEvent, NDKKind, NDKList, NDKPrivateKeySigner, NDKRelay, NDKRelaySet, NostrEvent } from '@nostr-dev-kit/ndk';
import NDKSessionProvider from '@/ndk-expo/providers/session';
import { BlurView } from 'expo-blur';

export {
  ErrorBoundary,
} from 'expo-router';

function UnpublishedEventIndicator() {
    const { ndk, unpublishedEvents } = useNDK();

    if (unpublishedEvents.size === 0) return null;

    return (
        <Link href="/unpublished">
            <View className='flex-row items-center'>
                <Icon name="archive-outline" />
                <View className='px-2 py-0.5 bg-red-500 rounded-md flex-row items-center gap-2'>
                    <Text className="text-white text-xs">
                        {unpublishedEvents.size}
                    </Text>
                </View>
            </View>
        </Link>
    )
}

export default function RootLayout() {
    useInitialAndroidBarSync();
    const { colors } = useColorScheme();
    const { colorScheme, isDarkColorScheme } = useColorScheme();

    const netDebug = (msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
        const url = new URL(relay.url);
        if (direction === 'send') console.log('👉', url.hostname, msg);
    }

    let relays = (SecureStore.getItem("relays")||"").split(",");

    relays = relays.filter(r => {
        try {
            return (new URL(r)).protocol.startsWith('ws')
        } catch (e) {
            return false;
        }
    })

    if (relays.length === 0) {
        relays.push('wss://relay.primal.net')
        relays.push('wss://relay.damus.io')
    }

    return (
        <>
            <StatusBar
                key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
                style={isDarkColorScheme ? 'light' : 'dark'}
            />
            <NDKProvider
                explicitRelayUrls={relays}
                cacheAdapter={new NDKCacheAdapterSqlite("olas")}
            >
                <NDKWalletProvider>
                    <NDKSessionProvider
                        follows={true}
                        kinds={new Map([[NDKKind.BlossomList, { wrapper: NDKList }]])}
                    >
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                                <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                    <Stack>
                                        <Stack.Screen
                                            name="login"
                                            options={{
                                                headerShown: false,
                                                presentation: 'modal',
                                            }}
                                        />

                                        <Stack.Screen
                                            name="publish"
                                            options={{
                                                headerShown: false,
                                                presentation: 'modal',
                                            }}
                                        />
                                        
                                        <Stack.Screen
                                            name="(tabs)"
                                            options={{
                                                headerShown: false
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
                                                headerRight: () => <View className="flex-row items-center gap-2">
                                                    <Button style={{ backgroundColor: colors.grey5 }} onPress={() => router.push('/comment')}>
                                                        <Text className="text-primary-secondary">Comment</Text>
                                                    </Button>
                                                </View>
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
            </NDKProvider>
        </>
    );
}
