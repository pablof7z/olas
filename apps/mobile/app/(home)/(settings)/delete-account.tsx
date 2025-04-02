import {
    NDKEvent,
    NDKKind,
    useNDK,
    useNDKCurrentUser,
} from '@nostr-dev-kit/ndk-mobile';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { SlideInLeft, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type ButtonState } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useAppSettingsStore } from '@/stores/app';

export default function DeleteAccountScreen() {
    const { ndk } = useNDK();
    const [buttonStatus, setButtonStatus] = useState<ButtonState>('idle');

    const showRealInTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const showRealInRef = useRef(5);
    const [showRealIn, setShowRealIn] = useState<number | null>(null);

    useEffect(() => {
        showRealInRef.current = 6;

        return () => {
            if (showRealInTimeoutRef.current) {
                clearInterval(showRealInTimeoutRef.current);
            }

            setShowRealIn(null);
        };
    }, []);

    const confirmAccountDeletion = useCallback(async () => {
        const advanceCounter = () => {
            showRealInRef.current--;
            setShowRealIn(showRealInRef.current);

            if (showRealInRef.current === 0 && showRealInTimeoutRef.current) {
                clearInterval(showRealInTimeoutRef.current);
            }
        };

        const setIt = () => {
            showRealInRef.current = 6;
            showRealInTimeoutRef.current = setInterval(advanceCounter, 1000);
            advanceCounter();
        };

        if (SecureStore.canUseBiometricAuthentication()) {
            try {
                await SecureStore.setItemAsync('access_check', 'test', {
                    requireAuthentication: true,
                });

                setIt();
            } catch (error) {
                console.error('error', error);
            }
        } else {
            setIt();
        }
    }, []);

    // const { logout } = useNDK(); // logout seems removed from useNDK result
    const resetAppSettings = useAppSettingsStore((s) => s.reset);

    const deleteAccount = useCallback(async () => {
        setButtonStatus('loading');

        if (!ndk) {
            console.error("NDK not available to delete account.");
            setButtonStatus('idle');
            return;
        }
        const event = new NDKEvent(ndk);
        event.kind = NDKKind.Vanish;
        event.tags = [['relay', 'ALL_RELAYS']];
        await event.publish();

        // ndk checked above
        const metadata = new NDKEvent(ndk);
        metadata.kind = NDKKind.Metadata;
        metadata.content = JSON.stringify({
            name: 'deleted-account',
        });
        await metadata.publish();
        setButtonStatus('success');

        // logout(); // Commented out - needs replacement
        resetAppSettings();

        router.replace('/(home)');

        alert('Your account has been deleted.');
    }, []);

    const currentUser = useNDKCurrentUser();
    const insets = useSafeAreaInsets();
    const bottomHeight = useBottomTabBarHeight();

    return (
        <View
            className="flex-1 flex-col justify-between p-4"
            style={{ paddingBottom: insets.bottom + bottomHeight + 20 }}
        >
            <Text variant="title1">Delete Account</Text>

            <Text variant="body" className="text-muted-foreground">
                Are you sure you want to delete your account? This will permanently delete all your
                content. No new content from this account will be accepted.
            </Text>
            <Text variant="body" className="font-bold !text-foreground">
                There is no way to undo this.
            </Text>

            <View className="flex-1" />

            {showRealIn !== null ? (
                <Animated.View key={1} entering={SlideInLeft} exiting={SlideOutRight}>
                    <Button
                        onPress={deleteAccount}
                        state={buttonStatus}
                        variant="destructive"
                        disabled={showRealIn > 0}
                        style={{ flexDirection: 'column', alignItems: 'center' }}
                    >
                        <Text
                            style={{ fontSize: 18, lineHeight: 18 }}
                            className="pt-2 font-bold text-white"
                        >
                            Confirm Account Deletion {showRealIn > 0 ? `(${showRealIn})` : ''}
                        </Text>
                        <Text style={{ lineHeight: 12, fontSize: 10, color: 'white' }}>
                            {currentUser?.npub.slice(0, 10)}...{currentUser?.npub.slice(-10)}
                        </Text>
                    </Button>
                </Animated.View>
            ) : (
                <Animated.View key={2} entering={SlideInLeft} exiting={SlideOutRight}>
                    <Button
                        onPress={confirmAccountDeletion}
                        state={buttonStatus}
                        variant="destructive"
                        style={{ flexDirection: 'column', alignItems: 'center' }}
                    >
                        <Text
                            style={{ fontSize: 18, lineHeight: 18 }}
                            className="pt-2 font-bold text-white"
                        >
                            Permanently Delete Account
                        </Text>
                        <Text style={{ lineHeight: 12, fontSize: 10, color: 'white' }}>
                            {currentUser?.npub.slice(0, 10)}...{currentUser?.npub.slice(-10)}
                        </Text>
                    </Button>
                </Animated.View>
            )}
        </View>
    );
}
