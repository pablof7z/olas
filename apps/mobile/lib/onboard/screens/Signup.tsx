import React, { useCallback, useState, useEffect } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { NDKEvent, NDKPrivateKeySigner, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { ArrowRight } from 'lucide-react-native';
import { useNDK, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { uploadMedia } from '@/lib/publish/actions/upload';
import { prepareMedia } from '@/utils/media/prepare';
import { createNip60Wallet } from '@/utils/wallet';
import { AvatarChooser } from '../components/AvatarChooser';
import { avatarAtom, modeAtom, usernameAtom } from '../store';

export function SignUp() {
    const [username, setUsername] = useAtom(usernameAtom);
    const { ndk, login } = useNDK();
    const setMode = useSetAtom(modeAtom);
    const { setActiveWallet } = useNDKWallet();
    const avatar = useAtomValue(avatarAtom);
    const [isNsec, setIsNsec] = useState(false);

    // Check if username starts with nsec1
    useEffect(() => {
        if (username && username.trim().replace(/^@/, '').toLowerCase().startsWith('nsec1')) {
            setIsNsec(true);
        } else {
            setIsNsec(false);
        }
    }, [username]);

    const createAccount = useCallback(async () => {
        if (!username) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        const signer = NDKPrivateKeySigner.generate();
        await login(signer.nsec);

        let imageUrl = 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=' + username;

        if (avatar) {
            try {
                const media = await prepareMedia([{ uris: [avatar], id: 'avatar', mediaType: 'image', contentMode: 'square' }]);
                const uploaded = await uploadMedia(media, ndk);
                if (uploaded && uploaded[0] && uploaded[0].uploadedUri) {
                    imageUrl = uploaded[0].uploadedUri;
                }
            } catch (error) {
                console.error('Error uploading avatar:', error);
            }
        }

        try {
            const event = new NDKEvent(ndk, {
                kind: 0,
                content: JSON.stringify({
                    name: username.replace(/^@/, ''),
                    image: imageUrl,
                }),
                tags: [],
                created_at: Math.floor(Date.now() / 1000),
                pubkey: '', // This will be set by NDK
            } as unknown as NostrEvent);
            await event.publish();

            createNip60Wallet(ndk).then((wallet) => {
                setActiveWallet(wallet);
            });

            router.replace('/');
        } catch (error) {
            console.error('Error creating account:', error);
            Alert.alert('Error', 'Failed to create account');
        }
    }, [username, avatar, ndk, login, setActiveWallet]);

    const switchToLogin = useCallback(() => {
        setMode('login');
    }, [setMode]);

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
                {isNsec ? (
                    <Text variant="caption1" className="w-full text-red-500">
                        That looks like a private key. Do you want to login instead?
                    </Text>
                ) : (
                    <Text variant="caption1" className="w-full text-muted-foreground">
                        Choose a username
                    </Text>
                )}
            </View>

            <Button variant="accent" size="lg" className="w-full" onPress={createAccount} disabled={isNsec}>
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Text className="py-2 text-lg font-bold text-white">Sign Up</Text>
                    <ArrowRight size={24} color="white" />
                </View>
            </Button>

            <Button variant="plain" onPress={switchToLogin}>
                <Text>Already on Nostr?</Text>
            </Button>
        </View>
    );
}
