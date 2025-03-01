import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Pressable, ViewStyle } from 'react-native';
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

    const flareBorderContainerStyle = useMemo<ViewStyle>(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: imageSize,
            overflow: 'hidden',
        }
    }, [imageSize, borderWidth, borderColor])

    return (<Animated.View ref={ref} style={style}>
        {flare && <View style={flareBorderContainerStyle}><FlareElement flare={flare} size={imageSize} borderWidth={borderWidth} /></View>}
        <AvatarInner
            image={imageSource}
            pubkey={pubkey}
            imageSize={imageSize}
            borderWidth={borderWidth}
            canSkipBorder={canSkipBorder}
            flare={flare}
            borderColor={borderColor}
            includeFlareLabel={includeFlareLabel}
            {...props}
        />
    </Animated.View>)
});

type AvatarInnerProps = {
    image: ImageSourcePropType;
    pubkey: string;
    imageSize: number;
    borderWidth: number;
    includeFlareLabel: boolean;
    canSkipBorder: boolean;
    flare: string | null;
    borderColor: string;
}

function AvatarInner({ image, pubkey, imageSize, borderWidth, canSkipBorder, flare, borderColor, includeFlareLabel, ...props }: AvatarInnerProps) {
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
        }
    }, [imageSize])

    const imageStyle = useMemo(() => {
        return {
            width: realImageSize,
            height: realImageSize,
            borderRadius: realImageSize,
        }
    }, [imageSize])

    return (
        <>
            <Animated.View style={innerContainerStyle}>
                {image?.width ? (
                    <Image
                        source={image}
                        style={imageStyle}
                        recyclingKey={pubkey}
                    />
                ) : (
                    <View style={{ width: realImageSize, height: realImageSize, borderRadius: realImageSize, backgroundColor: `#${pubkey.slice(0, 6)}` }} />
                )}
            </Animated.View>
            {includeFlareLabel && (
                <View style={styles.flareLabelContainer}>
                    <FlareLabel pubkey={pubkey} flare={flare} />
                </View>
            )}
        </>
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