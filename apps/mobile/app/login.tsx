import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, View, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useRouter } from 'expo-router';
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk-mobile';
import { nip19 } from 'nostr-tools';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { QrCode } from 'lucide-react-native';

export default function LoginScreen() {
    const [payload, setPayload] = useState<string | undefined>(undefined);
    const { ndk, loginWithPayload, currentUser } = useNDK();
    const router = useRouter();

    const handleLogin = async () => {
        if (!ndk) return;
        try {
            await loginWithPayload(payload, { save: true });
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        }
    };

    useEffect(() => {
        if (currentUser) {
            router.replace('/');
        }
    }, [currentUser]);

    const createAccount = async () => {
        const signer = NDKPrivateKeySigner.generate();
        const nsec = nip19.nsecEncode(signer._privateKey!);
        await loginWithPayload(nsec, { save: true });

        router.replace('/');
    };

    const [scanQR, setScanQR] = useState(false);

    async function handleBarcodeScanned({ data }: { data: string }) {
        setPayload(data.trim());
        setScanQR(false);
        try {
            await loginWithPayload(data.trim(), { save: true });
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        }
    }

    return (
        <View className="w-full flex-1 items-center justify-center bg-card px-8 py-4">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View className="h-full w-full flex-1 items-stretch justify-center gap-4">
                    <Text variant="heading" className="text-2xl font-bold">
                        Login
                    </Text>

                    {scanQR && (
                        <View style={{ borderRadius: 8, height: Dimensions.get('window').width * 0.75, width: Dimensions.get('window').width *0.75 }}>
                            <CameraView
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr']
                                }}
                                style={{ flex: 1, width: '100%', borderRadius: 8 }}
                                onBarcodeScanned={handleBarcodeScanned}
                            />
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        className="text-foreground"
                        multiline
                        autoCapitalize="none"
                        autoComplete={undefined}
                        placeholder="Enter your nsec or bunker:// connection"
                        autoCorrect={false}
                        value={payload}
                        onChangeText={setPayload}
                    />

                    <Button size={Platform.select({ ios: 'lg', default: 'md' })} onPress={handleLogin}>
                        <Text>Login</Text>
                    </Button>

                    <Button variant="tonal" onPress={createAccount}>
                        <Text>New to nostr?</Text>
                    </Button>

                    {!scanQR && (
                        <View className='flex-row justify-center w-full'>
                            <Button variant="plain" onPress={() => {
                                ndk.signer = undefined;
                                setScanQR(true);
                            }} className="border border-border bg-muted/10" style={{ flexDirection: 'column', gap: 8 }}>
                                <QrCode size={64} />
                                <Text>Scan QR</Text>
                            </Button>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
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
    button: {
        backgroundColor: '#007AFF',
        textAlign: 'center',
        padding: 20,
        borderRadius: 99,
        marginBottom: 10,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
