import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image, ImageProps, useImage } from 'expo-image';

interface AvatarProps extends ImageProps {
    pubkey: Hexpubkey;
    userProfile: NDKUserProfile | null;
    imageSize?: number;
}

const UserAvatar: React.FC<AvatarProps> = ({ pubkey, userProfile, imageSize = 128, ...props }) => {
    const size = 128;
    imageSize ??= size / 3;

    const proxiedImageUrl: string | null = userProfile?.image ? getProxiedImageUrl(userProfile.image, size) : null;

    const imageSource = useImage({
        uri: proxiedImageUrl,
        width: size,
        height: size,
        cacheKey: pubkey,
    }, {
        onError: () => {
            console.log('error loading image', pubkey);
        }
    })

    if (!imageSource) {
        const color = pubkey.slice(0, 6);
        const styles = {
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `#${color}`,
            ...(props.style as object || {})
        }
        return (<View
            className={props.className}
            style={styles}
            >   
                <Text className="text-foreground text-xl">{pubkey.slice(0, 2).toUpperCase()}</Text>
            </View>
        );
    }

    return (<View
        style={{ width: imageSize, height: imageSize, borderRadius: imageSize, overflow: 'hidden' }}
    >
        <Image
            source={imageSource}
            recyclingKey={pubkey}
            style={{ width: imageSize, height: imageSize }}
            className="flex-1"
        />
    </View>
    );
};

export default UserAvatar;
