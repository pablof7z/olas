import React from 'react';
import { Text } from 'react-native';
import { useUserProfile } from './profile';

interface FieldProps {
    label: string;
    fallback?: string;
}

/**
 * Renders the name of a user
 */
const Field: React.FC<FieldProps> = ({ label, fallback, ...props }) => {
    const { userProfile } = useUserProfile();

    if (!userProfile?.[label] && !fallback) {
        return null;
    }

    return <Text {...props}>{userProfile?.[label] || fallback}</Text>;
};

export default Field;
