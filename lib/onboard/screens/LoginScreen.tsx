import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn, useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import {
    NDKEvent,
    NDKNip55Signer,
    NDKPrivateKeySigner,
    useNDK,
    useNDKSessionLogin,
    useNDKWallet,
    useNip55,
} from '@nostr-dev-kit/ndk-mobile';

import { modeAtom, usernameAtom, avatarAtom, payloadAtom } from '../store';
import { Login } from './Login';
import { SignUp } from './Signup';
import { Welcome } from './Welcome';

import { Text } from '@/components/nativewindui/Text';
import { LavaLamp } from '@/components/ui/LavaLamp';
import { prepareMedia } from '@/utils/media/prepare';
import { uploadMedia } from '@/lib/publish/actions/upload';
import { createNip60Wallet } from '@/utils/wallet';

function CreateAccountButton() {
    const [mode, setMode] = useAtom(modeAtom);
    const ndkLogin = useNDKSessionLogin();
    const { setActiveWallet } = useNDKWallet();
    const username = useAtomValue(usernameAtom);
    const avatar = useAtomValue(avatarAtom);
    const { ndk } = useNDK();

    const handleCreateAccount = useCallback(async () => {
        if (!ndk) return;
        if (!username) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        let imageUrl = `https://api.dicebear.com/9.x/shapes/png?seed=${username}`;

        const signer = NDKPrivateKeySigner.generate();
        await ndkLogin(signer);

        if (avatar) {
            try {
                const media = await prepareMedia([
                    { uris: [avatar], id: "avatar", mediaType: "image", contentMode: "square" },
                ]);
                const uploaded = await uploadMedia(media, ndk);
                if (uploaded?.[0]?.uploadedUri) {
                    imageUrl = uploaded[0].uploadedUri;
                }
            } catch (error) {
                console.error("Error uploading avatar:", error);
            }
        }

        const event = new NDKEvent(ndk, {
            kind: 0,
            content: JSON.stringify({
                name: username.replace(/^@/, ""),
                picture: imageUrl,
            }),
        });
        await event.publish();

        createNip60Wallet(ndk).then((wallet) => {
            setActiveWallet(wallet);
        });

        router.replace("/");
    }, [username, ndkLogin]);

    const handlePress = () => {
        if (mode === 'signup') handleCreateAccount();
        else setMode('signup');
    };

    const isNotPrimary = mode && mode !== 'signup';

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={isNotPrimary ? styles.notPrimaryButton : styles.button}
        >
            <Text style={isNotPrimary ? styles.notPrimaryButtonText : styles.buttonText}>
                Create Account
            </Text>
        </TouchableOpacity>
    );
}

function LoginWithNip55Button() {
    const mode = useAtomValue(modeAtom);
    const { apps } = useNip55();
    const login = useNDKSessionLogin();

    const loginWith = useCallback(
        async (packageName: string) => {
            try {
                const nip55Signer = new NDKNip55Signer(packageName);
                await login(nip55Signer, true);
            } catch (error) {
                console.error(`Failed to login with NIP-55 app ${packageName}:`, error);
                // Add user feedback here (e.g., toast notification)
            }
        },
        []
    );

    if (apps.length === 0) return null;

    const isNotPrimary = mode && mode !== 'nip55';
    const app = apps[0]; // Assuming you want to show the first app as a primary button

    return (
        <TouchableOpacity
            onPress={() => loginWith(app.packageName)}
            style={isNotPrimary ? styles.notPrimaryButton : styles.button}
        >
            <Text style={isNotPrimary ? styles.notPrimaryButtonText : styles.buttonText}>
                Login with {app.name}
            </Text>
        </TouchableOpacity>
    )
}

function LoginButton() {
    const [mode, setMode] = useAtom(modeAtom);
    const payload = useAtomValue(payloadAtom);

    const handlePress = () => {
        if (mode === 'login') {
            if (!payload) {
                Alert.alert('Error', 'Please enter your private key or scan a QR code');
                return;
            }
            // …real login logic here
        } else {
            setMode('login');
        }
    };

    const isNotPrimary = mode && mode !== 'login';

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={isNotPrimary ? styles.notPrimaryButton : styles.button}
        >
            <Text style={isNotPrimary ? styles.notPrimaryButtonText : styles.buttonText}>
                Login
            </Text>
        </TouchableOpacity>
    );
}

export default function LoginScreen() {
    const [mode, setMode] = useAtom(modeAtom);
    const router = useRouter();
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const { apps } = useNip55();
    const hasNip55Signer = useMemo(() => apps.length > 10, [apps.length]);

    useEffect(() => {
        if (hasNip55Signer) setMode("nip55");
        setMode(null);
    }, [hasNip55Signer])

    // shared value drives the flex of the button container
    const flexSv = useSharedValue(mode === null ? 0.5 : 0.2);
    useEffect(() => {
        flexSv.value = withSpring(mode === null ? 0.5 : 0.2, {
            damping: 18,
            stiffness: 200,
        });
    }, [mode]);

    const animatedButtonStyle = useAnimatedStyle(() => ({
    }));

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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    flex: 1,
                    width: '100%',
                    paddingTop: headerHeight + insets.top,
                    paddingBottom: insets.bottom,
                    paddingHorizontal: 20,
                }}
            >
                <LavaLamp />
                <Animated.View
                    layout={FadeIn.springify().damping(18).stiffness(200)}
                    style={styles.contentContainer}
                >
                    {mode === null ? (
                        <View>
                            <Welcome />
                        </View>
                    ) : mode === 'login' ? (
                        <View
                            style={styles.formContainer}
                        >
                            <Login />
                        </View>
                    ) : (
                        <View
                            style={styles.formContainer}
                        >
                            <SignUp />
                        </View>
                    )}
                </Animated.View>

                <Animated.View
                    style={[styles.buttonContainer, animatedButtonStyle]}
                >
                    {hasNip55Signer && <LoginWithNip55Button />}
                    {mode === 'login' ? (
                        <>
                            <LoginButton />
                            <CreateAccountButton />
                        </>
                    ) : (
                        <>
                            <CreateAccountButton />
                            <LoginButton />
                        </>
                    )}
                </Animated.View>

                <TouchableOpacity
                    onPress={handleTermsOfService}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingBottom: 20,
                    }}
                >
                    <Text className="text-sm text-foreground">
                        By continuing you agree to our{' '}
                        <Text className="text-sm text-foreground font-bold">
                            Terms of Service
                        </Text>
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    formContainer: {
        width: '100%',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        minHeight: 50,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        marginVertical: 5,
    },
    notPrimaryButton: {
        width: '100%',
        minHeight: 50,
        borderRadius: 20,
        justifyContent: 'center',
        marginVertical: 5,
        backgroundColor: '#00000077'
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    notPrimaryButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
});
