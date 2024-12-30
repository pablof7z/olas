import 'react-native-get-random-values';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, View, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { Image } from 'react-native';
import { router, useRouter } from 'expo-router';
import { NDKEvent, NDKPrivateKeySigner, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { nip19 } from 'nostr-tools';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { ArrowRight, Plus, QrCode } from 'lucide-react-native';
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const avatarAtom = atom<string | undefined>(undefined);
const usernameAtom = atom<string | undefined>("@");
const modeAtom = atom<'login' | 'signup'>('login');

function AvatarChooser() {
    const username = useAtomValue(usernameAtom);

    return (
        <View className="flex-row gap-4 relative w-28 h-24">
            <View className="w-24 h-24 bg-muted rounded-full border-2 border-accent overflow-hidden">
                <Image source={{uri: "https://kawaii-avatar.now.sh/api/avatar?username="+username}} className="w-full h-full object-cover rounded-full" />
            </View>

            {/* <Button
                size="icon"
                variant="accent"
                className="absolute bottom-0 right-0 !rounded-full" onPress={() => {
            }}>
                <Plus size={24} color="white" />
            </Button> */}
        </View>
    )
}

function SignUp() {
    const [username, setUsername] = useAtom(usernameAtom);
    const { ndk, login } = useNDK();
    const setMode = useSetAtom(modeAtom);

    const createAccount = useCallback(async () => {
        const signer = NDKPrivateKeySigner.generate();
        const nsec = nip19.nsecEncode(signer._privateKey!);
        await login(nsec);

        const event = new NDKEvent(ndk, {
            kind: 0,
            content: JSON.stringify({
                name: username.replace(/^@/, ''),
                image: "https://kawaii-avatar.now.sh/api/avatar?username="+username,
            }),
            tags: []
        } as NostrEvent);
        await event.publish();

        router.replace('/');
    }, [username]);
    
    return <View className='flex-col w-full gap-4 items-center'>
        <Text variant="caption1" className="text-2xl font-bold">
            Sign Up
        </Text>

        <AvatarChooser />

        <TextInput
            className="text-foreground border border-border rounded-md p-2 w-full text-xl"
            autoFocus={true}
            autoCapitalize="none"
            autoComplete={undefined}
            placeholder="Enter your username"
            autoCorrect={false}
            value={username}
            onChangeText={(t) => {
                if (!t.startsWith('@')) t = '@' + t;
                setUsername(t.trim())
            }}
        />

        <Button variant="accent" size="lg" className="w-full" onPress={createAccount}>
            <Text className="text-white text-lg font-bold py-2">Sign Up</Text>
            <ArrowRight size={24} color="white" />
        </Button>

        <Button variant="plain" onPress={() => {
                setMode('login');
            }}>
                <Text>Already in Nostr?</Text>
            </Button>
    </View>
}

export default function LoginScreen() {
    const [payload, setPayload] = useState<string | undefined>(undefined);
    const { ndk, login } = useNDK();
    const currentUser = useNDKCurrentUser();
    const router = useRouter();
    const mode = useAtomValue(modeAtom);
    const setMode = useSetAtom(modeAtom);
    const logo = require('../assets/logo.png');
    
    const handleLogin = async () => {
        if (!ndk) return;
        try {
            await login(payload);
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        }
    };

    useEffect(() => {
        if (currentUser) {
            router.replace('/');
        }
    }, [currentUser]);

    const [scanQR, setScanQR] = useState(false);

    async function handleBarcodeScanned({ data }: { data: string }) {
        setPayload(data.trim());
        setScanQR(false);
        try {
            await login(data.trim());
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        }
    }

    return (
        <View className="w-full flex-1 items-center justify-center bg-card px-8 py-4">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <Image source={logo} style={{ width: 300, height: 100, objectFit: 'contain' }} />
                
                {mode === 'login' ? (
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
                        multiline={true}
                        autoCapitalize="none"
                        autoComplete={undefined}
                        placeholder="Enter your nsec or bunker:// connection"
                        autoCorrect={false}
                        value={payload}
                        onChangeText={setPayload}
                    />

                    <Button variant="accent" size={Platform.select({ ios: 'lg', default: 'md' })} onPress={handleLogin}>
                        <Text className="text-white text-lg font-bold py-2">Login</Text>
                        <ArrowRight size={24} color="white" />
                    </Button>

                    <Button variant="plain" onPress={() => {
                        setMode('signup');
                    }}>
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
                ) : (
                    <SignUp />
                )}
            </KeyboardAvoidingView>
        </View>
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
