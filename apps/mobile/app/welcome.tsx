import { Icon } from '@roninoss/icons';
import { Link, router, Stack } from 'expo-router';
import { Platform, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { useNDK } from '@/ndk-expo/hooks/ndk';
import { useEffect } from 'react';

const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function WelcomeConsentScreen() {
    const { colors } = useColorScheme();
    const { loginWithPayload, currentUser } = useNDK();

    // useEffect(() => {
    //     if (currentUser && walletService?.defaultWallet) {
    //         router.replace("/(wallets)")
    //     }
    // }, [currentUser, walletService?.defaultWallet]);

    // if (storePayload) {
    //     loginWithPayload(storePayload, { save: false })
    //     return (
    //         <View className="flex-1 justify-center items-center">
    //             <Text>Loading...</Text>
    //             <Text>{storePayload}...</Text>
    //             <Text>{currentUser?.npub}...</Text>
    //             <Text>{!!currentUser ? "yes" : "no"}...</Text>
    //         </View>
    //     )
    // }

    return (
        <SafeAreaView style={ROOT_STYLE}>
            <View className="mx-auto max-w-sm flex-1 justify-between gap-4 px-8 py-4 ">
                <View className="ios:pt-8 pt-12">
                    <Text variant="largeTitle" className="ios:text-left ios:font-black text-center text-6xl font-bold text-primary">
                        Snapstr
                    </Text>

                    <Text variant="subhead" className="mb-6 text-lg font-bold">
                        Beauty is everywhere. Specially in nostr.
                    </Text>
                </View>

                <View className="gap-8">
                    {FEATURES.map((feature) => (
                        <View key={feature.title} className="flex-row gap-4">
                            <View className="pt-px">
                                <Icon name={feature.icon} size={38} color={colors.primary} ios={{ renderingMode: 'hierarchical' }} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold">{feature.title}</Text>
                                <Text variant="footnote">{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <View className="gap-4">
                    <View className="items-center">
                        <Icon name="account-multiple" size={24} color={colors.primary} ios={{ renderingMode: 'hierarchical' }} />
                        <Text variant="caption2" className="pt-1 text-center">
                            By pressing continue, you agree to the universe's{' '}
                            <Link href="/">
                                <Text variant="caption2" className="text-primary">
                                    Terms of Service
                                </Text>
                            </Link>{' '}
                        </Text>
                    </View>
                    <Link href="/login" replace asChild>
                        <Button size={Platform.select({ ios: 'lg', default: 'md' })}>
                            <Text>Continue</Text>
                        </Button>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}

const FEATURES = [
    {
        title: '#reckless',
        description: 'This is very experimental. Expect bugs, annoyances aaaaand money gone.',
        icon: 'brain',
    },
    {
        title: 'Powered by Cashu',
        description: 'Interact with your NIP-60 cashu tokens',
        icon: 'message-processing',
    },
] as const;
