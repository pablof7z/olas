import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Pressable } from 'react-native';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Image, ImageProps, useImage } from 'expo-image';
import FlareLabel, { FlareElement } from './flare';
import { useColorScheme } from '@/lib/useColorScheme';

interface AvatarProps extends ImageProps {
    pubkey: Hexpubkey;
    userProfile: NDKUserProfile | null;
    imageSize?: number;
    borderWidth?: number;
    flare?: string | null;
    includeFlareLabel?: boolean;

    /**
     * Whether to skip padding the avatar if there is no flare border to be displayed!
     */
    canSkipBorder?: boolean;

    /**
     * The color of the border to be displayed around the avatar.
     */
    borderColor?: string;
}

const UserAvatar = forwardRef(function UserAvatar({
    pubkey,
    userProfile,
    flare,
    borderWidth,
    imageSize = 128,
    includeFlareLabel = false,
    canSkipBorder = false,
    borderColor,
    ...props
}: AvatarProps, ref) {
    const { colors } = useColorScheme();
    const size = 128;
    imageSize ??= size / 3;
    borderWidth ??= imageSize / 16;

    const proxiedImageUrl: string | null = userProfile?.picture ? getProxiedImageUrl(userProfile.picture, 300) : null;

    borderColor ??= colors.card;

    const imageSource = useImage({
        uri: proxiedImageUrl ? proxiedImageUrl : undefined,
        width: size,
        height: size,
        cacheKey: pubkey,
    }, {
        onError: () => {
            if (proxiedImageUrl) console.log('error loading image', pubkey);
        }
    })

    if (!pubkey) {
        alert('no pubkey was passed to the UserAvatar component! This is a bug');
        return null;
    }

    const style = useAnimatedStyle(() => {
        return {
            ...styles.container,
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize,
        }
    })

    return (<Animated.View ref={ref} style={style}>
        {flare && <FlareElement flare={flare} size={imageSize} />}
        <AvatarInner
            image={imageSource}
            pubkey={pubkey}
            imageSize={imageSize}
            borderWidth={borderWidth}
            canSkipBorder={canSkipBorder}
            flare={flare}
            borderColor={borderColor}
            {...props}
        />
    </Animated.View>)
});

function AvatarInner({ image, pubkey, imageSize, borderWidth, canSkipBorder, flare, borderColor, ...props }: { image: ImageSourcePropType, pubkey: string, imageSize: number, borderWidth: number, imageMargin: number, canSkipBorder: boolean, flare: string | null, borderColor: string, [key: string]: any }) {
    let imageMargin = borderWidth / 3;
    let realImageSize = imageSize - borderWidth * 2 - imageMargin * 2;

    if (canSkipBorder && !flare) {
        borderWidth = 0;
        imageMargin = 0;
        realImageSize = imageSize;
    }
    
    const innerContainerStyle = useMemo(() => {
        return {
            width: imageSize - borderWidth*2,
            height: imageSize - borderWidth*2,
            borderRadius: imageSize - borderWidth*2,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: imageMargin,
            borderColor: borderColor,
        }
    }, [imageSize])

    const imageStyle = useMemo(() => {
        return {
            width: realImageSize,
            height: realImageSize,
            borderRadius: realImageSize,
        }
    }, [imageSize])
    
    // if (!image) return <Text className="text-foreground text-xl">{pubkey.slice(0, 2).toUpperCase()}</Text>

    // if (!flare) {
        // return (
        //     <Image
        //         source={image}
        //         recyclingKey={pubkey}
        //     />
        // )
    // }

    return (
        <Animated.View style={innerContainerStyle}>
            <Image
                source={image}
                style={imageStyle}
            />
        </Animated.View>
    )

    // if (flare) {
    //     return (<View>
    //         <View
    //             style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: imageSize, height: imageSize, borderRadius: imageSize, overflow: 'hidden', position: 'relative' }}
    //         >
    //             <FlareElement flare={flare} size={imageSize} />

    //             <View
    //                 style={{ width: imageSize-borderWidth*2, height: imageSize-borderWidth*2, borderRadius: imageSize, borderWidth: imageMargin, borderColor: 'white', overflow: 'hidden'}}
    //             >
    //                 <Image
    //                     source={imageSource}
    //                     recyclingKey={pubkey}
    //                     style={{ width: realImageSize, height: realImageSize, borderRadius: imageSize }}
    //                     className="flex-1"
    //                 />
    //             </View>
    //             </View>
    //             {includeFlareLabel && (
    //                 <View style={styles.flareLabelContainer}>
    //                     <FlareLabel pubkey={pubkey} flare={flare} />
    //                 </View>
    //             )}
    //         </View>
    //     );
    // }

    // if (canSkipBorder) {
    //     borderWidth = 0;
    //     imageMargin = 0;
    //     realImageSize = imageSize;
    // }

    // return (<View
    //     style={{ padding: borderWidth + imageMargin, width: imageSize, height: imageSize, overflow: 'hidden', position: 'relative' }}
    // >
    //         <Image
    //             source={imageSource}
    //             recyclingKey={pubkey}
    //             style={{ flex: 1, width: realImageSize, height: realImageSize, borderRadius: imageSize }}
    //             className="flex-1"
    //         />
    // </View>
    // );
};

export default UserAvatar;

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flareLabelContainer: {
        position: 'absolute',
        bottom: -4,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    }
});