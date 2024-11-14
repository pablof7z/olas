import React from 'react';
import { View, Text } from 'react-native';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/nativewindui/Avatar';
import { useUserProfile } from './profile';

interface AvatarProps extends React.ComponentProps<typeof Avatar> {
}

const UserAvatar: React.FC<AvatarProps> = ({ ...props }) => {
    const { user, userProfile } = useUserProfile();

    return (
        <View>
            <Avatar {...props}>
                {userProfile?.image && (
                    <AvatarImage
                        source={{ uri: userProfile?.image }}
                    />
                )}
                <AvatarFallback>
                    <Text className="text-foreground">{user?.pubkey.slice(0, 2).toUpperCase()}</Text>
                </AvatarFallback>
            </Avatar>
        </View>
    );
};

export default UserAvatar;
