import React from 'react';
import { Text } from 'react-native';
import { useUserProfile } from './profile';

/**
 * Renders the name of a user
 */
const Name: React.FC<Text['props']> = (props) => {
    const { userProfile, user } = useUserProfile();

    return (
        <Text {...props}>
            {userProfile?.displayName || userProfile?.name || user?.npub.substring(0, 6)}
        </Text>
    );
};

export default Name;
