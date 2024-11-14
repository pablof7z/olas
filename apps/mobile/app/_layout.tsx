import '../global.css';
import 'expo-dev-client';
import "@bacons/text-decoder/install";
import "react-native-get-random-values";
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { NDKCacheAdapterSqlite, useNDK } from "@/ndk-expo";
import { Link, router, Stack, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';  
import { Platform, View, SafeAreaView, Pressable, TouchableOpacity } from 'react-native';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { NDKProvider } from '~/ndk-expo';
import { NDKWalletProvider } from '@/ndk-expo/providers/wallet';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@roninoss/icons';
import { cn } from '@/lib/cn';
import { NDKEvent, NDKPrivateKeySigner, NDKRelay, NDKRelaySet, NostrEvent } from '@nostr-dev-kit/ndk';

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
                cacheAdapter={new NDKCacheAdapterSqlite("nutsack")}
                netDebug={netDebug}
            >
                <NDKWalletProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                            <NavThemeProvider value={NAV_THEME[colorScheme]}>
                                <Stack
                                    screenOptions={{
                                        animation: 'ios',
                                        title: "Home",
                                        headerShown: true,
                                        headerTintColor: Platform.OS === 'ios' ? undefined : colors.foreground,
                                    }}
                                >
                                    <Stack.Screen name="index" options={{
                                        headerShown: true,
                                        headerLeft: () => (
                                            <UnpublishedEventIndicator />
                                        ),
                                        headerTitle: () => <Text>Wallets</Text>,
                                        headerRight: () => (
                                            <Link href="/(settings)">
                                                <Icon name="cog-outline" size={24} color={colors.foreground} />
                                            </Link>
                                        )
                                    }} />

                                    <Stack.Screen name="/(publish)" options={{
                                        presentation: 'modal',
                                        title: 'Publish',
                                    }} />
                                    
                                    <Stack.Screen name="(settings)" options={SETTINGS_OPTIONS} />
                                    <Stack.Screen name="login" options={LOGIN_OPTIONS} />
                                    <Stack.Screen name="unpublished" options={{
                                        presentation: 'modal',
                                        title: 'Unpublished data',
                                    }} />
                                </Stack>
                            </NavThemeProvider>
                        </KeyboardProvider>
                    </GestureHandlerRootView>
                </NDKWalletProvider>
            </NDKProvider>
        </>
    );
}

const LOGIN_OPTIONS = {
  presentation: 'modal',
  headerShown: false,
  animation: 'fade_from_bottom', // for android
} as const;

const SETTINGS_OPTIONS = {
    presentation: 'modal',
    headerShown: false,
    animation: 'fade_from_bottom', // for android
  } as const;

function SettingsIcon() {
    const { colors } = useColorScheme();
    return (
      <Link href="/(wallet)/(settings)" asChild>
        <Pressable className="opacity-80 pr-2">
          {({ pressed }) => (
            <View className={cn(pressed ? 'opacity-50' : 'opacity-90')}>
              <Icon name="cog-outline" size={32} color={colors.foreground} />
            </View>
          )}
        </Pressable>
      </Link>
    );
} 