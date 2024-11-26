import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';

interface AvatarProps extends Omit<React.ComponentProps<typeof Avatar>, 'alt'> {
    size?: number;
    userProfile: NDKUserProfile | null;
    alt?: string;
}

const UserAvatar: React.FC<AvatarProps> = ({ size, userProfile, ...props }) => {
    size ??= 64;

    const proxiedImageUrl = useMemo(() => userProfile?.image && getProxiedImageUrl(userProfile.image, size), [userProfile?.image, size]);

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
                    <Text className="text-foreground">...</Text>
                </AvatarFallback>
            </Avatar>
        </View>
    );
};

export default UserAvatar;
