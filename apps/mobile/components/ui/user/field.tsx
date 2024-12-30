import React from 'react';
import { Text } from 'react-native';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
interface FieldProps {
    userProfile: NDKUserProfile | null;
    label: string;
    fallback?: string;
}

/**
 * Renders the name of a user
 */
const Field: React.FC<FieldProps> = ({ userProfile, label, fallback, ...props }) => {
    if (!userProfile?.[label] && !fallback) {
        return null;
    }

    return <Text {...props}>{userProfile?.[label] || fallback}</Text>;
};

export default Field;
