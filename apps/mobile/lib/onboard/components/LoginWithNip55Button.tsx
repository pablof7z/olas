import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNip55 } from '@nostr-dev-kit/ndk-mobile';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';

export function LoginWithNip55Button() {
    const { apps } = useNip55();
    const { login } = useNDK();

    const loginWith = useCallback(
        async (packageName: string) => {
            login('nip55 ' + packageName);
        },
        [login]
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
