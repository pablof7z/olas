import 'react-native-get-random-values';
import React, { useCallback, useEffect, useState } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, View, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import { Image } from 'react-native';
import { router, Stack, useRouter } from 'expo-router';
import { NDKEvent, NDKPrivateKeySigner, NostrEvent, useNip55 } from '@nostr-dev-kit/ndk-mobile';
import { nip19 } from 'nostr-tools';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { ArrowRight, Camera, Plus, QrCode } from 'lucide-react-native';
import { useNDK, useNDKCurrentUser, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import ImageCropPicker from 'react-native-image-crop-picker';
import { uploadMedia } from '@/lib/post-editor/actions/upload';
import { prepareMedia } from '@/lib/post-editor/actions/prepare';
import { createNip60Wallet } from '@/utils/wallet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const avatarAtom = atom<string>("");
const usernameAtom = atom<string | undefined>('@');
const modeAtom = atom<'login' | 'signup'>('signup');

export function LoginWithNip55Button() {
    const {apps} = useNip55();
    const { login } = useNDK();
    
    const loginWith = useCallback(async (packageName: string) => {
        login('nip55 ' + packageName);
    }, [])
    
    if (apps.length === 0) return null;

    return <View style={styles.container}>
        {apps.map((app, index) => (
            <Button key={index} variant="primary" onPress={() => loginWith(app.packageName)}>
                <Text>Login with {app.name}</Text>
            </Button>
        ))}
    </View>
}

export function AvatarChooser() {
    const username = useAtomValue(usernameAtom);
    const [avatar, setAvatar] = useAtom(avatarAtom);
    const chooseImage = useCallback(() => {
        ImageCropPicker.openPicker({
            width: 400,
            height: 400,
            cropping: true,
            multiple: false,
            mediaType: 'photo',
            includeExif: false,
        }).then((image) => {
            setAvatar(image.path);
        });
    }, []);

    const openCamera = useCallback(() => {
        ImageCropPicker.openCamera({
            width: 400,
            height: 400,
            cropping: true,
            multiple: false,
            mediaType: 'photo',
            includeExif: false,
        }).then((image) => {
            setAvatar(image.path);
        });
    }, []);

    return (
        <View className="h-24 w-28 flex-row gap-4 items-center justify-center">
            <Button
                size="icon"
                variant="accent"
                className="!rounded-full" onPress={openCamera}
            >
                <Camera size={24} color="white" />
            </Button>
            
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-accent bg-muted">
                <Image
                    source={{ uri: avatar || 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=' + username }}
                    className="h-full w-full rounded-full object-cover"
                />
            </View>

            <Button
                size="icon"
                variant="accent"
                className="!rounded-full" onPress={chooseImage}
            >
                <Plus size={24} color="white" />
            </Button>
        </View>
    );
}

function SignUp() {
    const [username, setUsername] = useAtom(usernameAtom);
    const { ndk, login } = useNDK();
    const setMode = useSetAtom(modeAtom);
    const {setActiveWallet} = useNDKWallet();
    const avatar = useAtomValue(avatarAtom);
    const createAccount = useCallback(async () => {
        const signer = NDKPrivateKeySigner.generate();
        const nsec = nip19.nsecEncode(signer._privateKey!);
        await login(nsec);

        let imageUrl = 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=' + username;

        if (avatar) {
            const media = await prepareMedia([{ uris: [avatar], id: 'avatar', mediaType: 'image', contentMode: 'square' }]);
            const uploaded = await uploadMedia(media, ndk);
            imageUrl = uploaded[0].uploadedUri;
        }

        const event = new NDKEvent(ndk, {
            kind: 0,
            content: JSON.stringify({
                name: username.replace(/^@/, ''),
                image: imageUrl,
            }),
            tags: [],
        } as NostrEvent);
        await event.publish();

        createNip60Wallet(ndk).then((wallet) => {
            setActiveWallet(wallet);
        });

        router.replace('/');
    }, [username]);

    return (
        <View className="w-full flex-col items-center gap-4">
            <AvatarChooser />

            <View style={{ flexDirection: 'column', width: '100%' }}>
                <TextInput
                    className="w-full rounded-md border border-border p-2 text-xl text-foreground"
                    autoCapitalize="none"
                    autoComplete={undefined}
                    placeholder="Enter your username"
                    autoCorrect={false}
                    value={username}
                    onChangeText={(t) => {
                        if (!t.startsWith('@')) t = '@' + t;
                        setUsername(t.trim());
                    }}
                />
                <Text variant="caption1" className="w-full text-muted-foreground">
                    Choose a username
                </Text>
            </View>

            <Button variant="accent" size="lg" className="w-full" onPress={createAccount}>
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Text className="py-2 text-lg font-bold text-white">Sign Up</Text>
                    <ArrowRight size={24} color="white" />
                </View>
            </Button>

            <Button
                variant="plain"
                onPress={() => {
                    setMode('login');
                }}>
                <Text>Already on Nostr?</Text>
            </Button>
        </View>
    );
}

export default function LoginScreen() {
    const [payload, setPayload] = useState<string | undefined>(undefined);
    const { ndk, login } = useNDK();
    const currentUser = useNDKCurrentUser();
    const router = useRouter();
    const mode = useAtomValue(modeAtom);
    const setMode = useSetAtom(modeAtom);

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

    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    const handleTermsOfService = useCallback(() => {
        router.push('/eula')
    }, []);
    

    return (
        <>
            <Stack.Screen options={{
                headerTransparent: true,
                title: ""
            }} />
            <View className="w-full flex-1 items-center justify-center bg-card px-8 py-4" style={{ paddingTop: headerHeight, paddingBottom: insets.bottom }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                    {mode === 'login' ? (
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
                                onPress={() => {
                                    setMode('signup');
                                }}>
                                <Text>New to nostr?</Text>
                            </Button>

                            {!scanQR && (
                                <View className="w-full flex-row justify-center">
                                    <Button
                                        variant="plain"
                                        onPress={() => {
                                            ndk.signer = undefined;
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
                    ) : (
                        <SignUp />
                    )}
                </KeyboardAvoidingView>

                <TouchableOpacity onPress={handleTermsOfService} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>
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
