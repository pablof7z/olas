import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { modeAtom } from '../store';
import { Login } from './Login';
import { SignUp } from './Signup';

import { Text } from '@/components/nativewindui/Text';

export default function LoginScreen() {
    const mode = useAtomValue(modeAtom);
    const router = useRouter();
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    const handleTermsOfService = useCallback(() => {
        router.push('/eula');
    }, [router]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    title: '',
                }}
            />
            <View
                className="w-full flex-1 items-center justify-center bg-card px-8 py-4"
                style={{ paddingTop: headerHeight, paddingBottom: insets.bottom }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    {mode === 'login' ? <Login /> : <SignUp />}
                </KeyboardAvoidingView>

                <TouchableOpacity
                    onPress={handleTermsOfService}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingBottom: 20,
                    }}
                >
                    <Text className="text-sm text-muted-foreground">
                        By continuing you agree to our{' '}
                        <Text className="text-sm text-primary">Terms of Service</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
});
