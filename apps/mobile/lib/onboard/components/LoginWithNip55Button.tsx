import { useNDK, useNip55, NDKNip55Signer } from '@nostr-dev-kit/ndk-mobile';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

export function LoginWithNip55Button() {
    const { apps } = useNip55();
    const { addSigner } = useNDK();

    const loginWith = useCallback(
        async (packageName: string) => {
            try {
                const nip55Signer = new NDKNip55Signer(packageName);
                // addSigner will now handle switching by default
                await addSigner(nip55Signer);
                // Optional: Could add a check here if addSigner threw an error
            } catch (error) {
                console.error(`Failed to login with NIP-55 app ${packageName}:`, error);
                // Add user feedback here (e.g., toast notification)
            }
        },
        [addSigner]
    );

    if (apps.length === 0) return null;

    return (
        <View style={styles.container}>
            {apps.map((app, index) => (
                <Button key={index} variant="primary" onPress={() => loginWith(app.packageName)}>
                    <Text>Login with {app.name}</Text>
                </Button>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
});
