import React from 'react';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Text, TextProps, View } from 'react-native';
import FlareLabel, { FlareElement } from './flare';

interface NameProps extends TextProps {
    userProfile?: NDKUserProfile | null;
    pubkey: string;
    flare?: string;
}

/**
 * Renders the name of a user
 */
const Name: React.FC<NameProps> = ({ userProfile, pubkey, flare, ...props }) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
                style={[
                    props.style,
                ]}
                {...props}>
                {userProfile?.displayName || userProfile?.name || pubkey?.substring?.(0, 6) || 'Unknown'}
            </Text>
            <FlareLabel flare={flare} pubkey={pubkey} />
        </View>
    );
};

export default Name;
