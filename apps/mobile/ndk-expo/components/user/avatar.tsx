import React from 'react';
import { View, Text } from 'react-native';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/nativewindui/Avatar';
import { useUserProfile } from './profile';
import { useColorScheme } from '@/lib/useColorScheme';

interface AvatarProps extends React.ComponentProps<typeof Avatar> {}

const UserAvatar: React.FC<AvatarProps> = ({ ...props }) => {
    const { user, userProfile, hasKind20 } = useUserProfile();
    const { colors } = useColorScheme();

    return (
        <View
            style={{
                borderRadius: 9999,
                borderWidth: hasKind20 ? 4 : 0,
                borderColor: colors.accent,
            }}>
            <Avatar {...props}>
                {userProfile?.image && (
                    <AvatarImage
                        source={{ uri: userProfile?.image }}
                        {...props}
                    />
                )}
                <AvatarFallback>
                    <Text className="text-foreground">
                        {user?.pubkey.slice(0, 2).toUpperCase()}
                    </Text>
                </AvatarFallback>
            </Avatar>
        </View>
    );
};

export default UserAvatar;
