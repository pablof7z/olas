import React from 'react';
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

    if (!pubkey) {
        console.trace('no pubkey');
        alert('no pubkey');
        return (
            <View style={{ width: imageSize, height: imageSize, borderRadius: imageSize, overflow: 'hidden' }}>
                <Text className="text-foreground text-xl">NO PUBKEY</Text>
            </View>
        );
    }

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

    const borderWidth = 4;

    return (<View
        style={{ width: imageSize, height: imageSize, borderRadius: imageSize, overflow: 'hidden', position: 'relative' }}
    >
        {/* <SweepGradientDemo size={imageSize} />
        <View
            style={{ width: imageSize-borderWidth*2, height: imageSize-borderWidth*2, borderRadius: imageSize, overflow: 'hidden'}}
        > */}
            <Image
                source={imageSource}
                recyclingKey={pubkey}
                style={{ width: imageSize, height: imageSize }}
                // style={{ width: imageSize-borderWidth*2, height: imageSize-borderWidth*2 }}
                className="flex-1"
            />
        {/* </View> */}
    </View>
    );
};

// export const SweepGradientDemo = ({ size }: { size: number }) => {
//     return (
//       <Canvas style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
//         <Rect x={0} y={0} width={size} height={size}>
//           <SweepGradient
//             c={vec(size / 2, size / 2)}
//             colors={["cyan", "magenta", "yellow", "cyan"]}
//           />
//         </Rect>
//       </Canvas>
//     );
// };

export default UserAvatar;
