import React, { useCallback, useEffect } from 'react';
import { View, TextInput, Alert, StyleSheet, Platform, Dimensions, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { ArrowRight, QrCode } from 'lucide-react-native';
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useSetAtom } from 'jotai';
import { LoginWithNip55Button } from '../components/LoginWithNip55Button';
import { modeAtom, payloadAtom, scanQRAtom } from '../store';

export function Login() {
    const [payload, setPayload] = useAtom(payloadAtom);
    const [scanQR, setScanQR] = useAtom(scanQRAtom);
    const { ndk, login } = useNDK();
    const currentUser = useNDKCurrentUser();
    const router = useRouter();
    const setMode = useSetAtom(modeAtom);

    const handleLogin = useCallback(async () => {
        if (!ndk) return;
        try {
            if (payload) {
                await login(payload);
            } else {
                Alert.alert('Error', 'Please enter your private key or scan a QR code');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'An error occurred during login');
        }
    }, [ndk, login, payload]);

    useEffect(() => {
        if (currentUser) {
            router.replace('/');
        }
    }, [currentUser, router]);

    async function handleBarcodeScanned({ data }: { data: string }) {
        setPayload(data.trim());
        setScanQR(false);
        try {
            await login(data.trim());
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'An error occurred during login');
        }
    }

    const switchToSignup = useCallback(() => {
        setMode('signup');
    }, [setMode]);

    return (
        <View className="h-full w-full flex-1 items-stretch justify-center gap-4">
            {scanQR && (
                <View
                    style={{
                        borderRadius: 8,
                        height: Dimensions.get('window').width * 0.75,
                        width: Dimensions.get('window').width * 0.75,
                    }}>
                    <CameraView
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                        style={{ flex: 1, width: '100%', borderRadius: 8 }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                </View>
            )}

            <TextInput
                style={styles.input}
                className="text-foreground placeholder:text-muted-foreground"
                multiline={true}
                autoCapitalize="none"
                autoComplete={undefined}
                placeholder="Enter your nsec or bunker:// connection"
                autoCorrect={false}
                value={payload}
                onChangeText={setPayload}
            />

            <Button variant="accent" size={Platform.select({ ios: 'lg', default: 'md' })} onPress={handleLogin}>
                <Text className="py-2 text-lg font-bold text-white">Login</Text>
                <ArrowRight size={24} color="white" />
            </Button>

            <LoginWithNip55Button />

            <Button
                variant="plain"
                onPress={switchToSignup}>
                <Text>New to nostr?</Text>
            </Button>

            {!scanQR && (
                <View className="w-full flex-row justify-center">
                    <Button
                        variant="plain"
                        onPress={() => {
                            if (ndk) ndk.signer = undefined;
                            setScanQR(true);
                        }}
                        className="bg-muted/10 border border-border"
                        style={{ flexDirection: 'column', gap: 8 }}>
                        <QrCode size={64} />
                        <Text>Scan QR</Text>
                    </Button>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        width: '100%',
        height: 100,
        borderColor: 'gray',
        fontFamily: 'monospace',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
}); 