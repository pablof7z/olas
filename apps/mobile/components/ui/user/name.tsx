import React from 'react';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Text, TextProps } from 'react-native';

interface NameProps extends TextProps {
    userProfile: NDKUserProfile | null;
    pubkey: string;
}

/**
 * Renders the name of a user
 */
const Name: React.FC<NameProps> = ({ userProfile, pubkey, ...props }) => {
    return (
        <Text
            style={[
                //     { color: hasKind20 ? colors.accent : colors.foreground },
                //     { fontWeight: hasKind20 ? 'bold' : 'normal' },
                props.style,
            ]}
            {...props}>
            {userProfile?.displayName || userProfile?.name || pubkey?.substring?.(0, 6) || 'Unknown'}
        </Text>
    );
};

export default Name;
