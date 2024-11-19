import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/nativewindui/Avatar';
import { useUserProfile } from './profile';
import { getProxiedImageUrl } from '@/utils/imgproxy';

interface AvatarProps extends React.ComponentProps<typeof Avatar> {
    size?: number;
}

const UserAvatar: React.FC<AvatarProps> = ({ size, ...props }) => {
    const { user, userProfile } = useUserProfile();
    // const { user, userProfile, hasKind20 } = useUserProfile();

    size ??= 64;

    const proxiedImageUrl = useMemo(() => userProfile?.image && getProxiedImageUrl(userProfile.image, size), [userProfile?.image, size]);

    console.log(proxiedImageUrl);

    return (
        <View
        // style={{
        //     borderRadius: 9999,
        //     borderWidth: hasKind20 ? 4 : 0,
        //     borderColor: colors.accent,
        // }}
        >
            <Avatar {...props}>
                {userProfile?.image && <AvatarImage source={{ uri: proxiedImageUrl }} {...props} />}
                <AvatarFallback>
                    <Text className="text-foreground">{user?.pubkey.slice(0, 2).toUpperCase()}</Text>
                </AvatarFallback>
            </Avatar>
        </View>
    );
};

export default UserAvatar;
