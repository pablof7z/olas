import { useAtom } from 'jotai';
import React, { useState, useEffect } from 'react';
import { TextInput, View } from 'react-native';

import { AvatarChooser } from '../components/AvatarChooser';
import { usernameAtom } from '../store';

import { Text } from '@/components/nativewindui/Text';

export function SignUp() {
    const [username, setUsername] = useAtom(usernameAtom);
    const [isNsec, setIsNsec] = useState(false);

    // Check if username starts with nsec1
    useEffect(() => {
        if (username?.trim().replace(/^@/, '').toLowerCase().startsWith('nsec1')) {
            setIsNsec(true);
        } else {
            setIsNsec(false);
        }
    }, [username]);

    return (
        <View className="w-full flex-col items-center gap-4">
            <AvatarChooser />

            <View style={{ flexDirection: 'column', width: '100%' }}>
                <TextInput
                    className="w-full rounded-full py-2.5 px-4 text-xl text-foreground bg-card"
                    autoCapitalize="none"
                    autoComplete={undefined}
                    placeholder="Enter your username"
                    autoCorrect={false}
                    value={username}
                    onChangeText={(t) => {
                        let value = t;
                        if (!value.startsWith('@')) value = `@${value}`;
                        setUsername(value.trim());
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
        </View>
    );
}
