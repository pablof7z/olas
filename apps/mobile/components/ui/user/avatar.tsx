import React, { ForwardedRef, forwardRef, useMemo } from 'react';
import { View, StyleSheet, ImageSourcePropType, ViewStyle, ImageStyle } from 'react-native';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image, ImageProps, useImage } from 'expo-image';
import FlareLabel, { FlareElement } from './flare';
import { useColorScheme } from '@/lib/useColorScheme';

interface AvatarProps extends ImageProps {
    pubkey: Hexpubkey;
    userProfile?: NDKUserProfile | null;
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

    /**
     * Whether to skip proxying the image.
     */
    skipProxy?: boolean;
}

const UserAvatar = forwardRef(function UserAvatar({
    pubkey,
    userProfile,
    flare,
    borderWidth,
    imageSize = 128,
    includeFlareLabel = false,
    canSkipBorder = false,
    skipProxy = false,
    borderColor,
    ...props
}: AvatarProps, ref: ForwardedRef<View>) {
    const { colors } = useColorScheme();
    const size = 128;
    imageSize ??= size / 3;
    borderWidth ??= imageSize / 16;

    let proxiedImageUrl: string | null = null;
    
    if (userProfile?.picture) {
        if (skipProxy) proxiedImageUrl = userProfile.picture;
        else proxiedImageUrl = getProxiedImageUrl(userProfile.picture, 300);
    }

    borderColor ??= colors.card;

    const imageSource = useImage({
        uri: proxiedImageUrl ? proxiedImageUrl : undefined,
        width: size,
        height: size,
        cacheKey: userProfile?.picture,
    }, {
        onError: () => {
            if (proxiedImageUrl) console.log('error loading image', pubkey);
        }
    })

    if (!pubkey) {
        alert('no pubkey was passed to the UserAvatar component! This is a bug');
        return null;
    }

    const style = useMemo<ViewStyle>(() => ({
        ...styles.container,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize,
    }), [imageSize])

    const flareBorderContainerStyle = useMemo<ViewStyle>(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: imageSize,
        overflow: 'hidden',
    }), [imageSize, borderWidth, borderColor])

    return (<View ref={ref} style={style}>
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
    </View>)
});

type AvatarInnerProps = {
    image: ImageSourcePropType | null;
    pubkey: string;
    imageSize: number;
    borderWidth: number;
    includeFlareLabel: boolean;
    canSkipBorder: boolean;
    flare: string | null | undefined;
    borderColor: string;
}

function AvatarInner({ image, pubkey, imageSize, borderWidth, canSkipBorder, flare, borderColor, includeFlareLabel, ...props }: AvatarInnerProps) {
    let imageMargin = borderWidth;
    let realImageSize = imageSize - borderWidth * 2 - imageMargin * 2;

    if (canSkipBorder && !flare) {
        borderWidth = 0;
        imageMargin = 0;
        realImageSize = imageSize;
    }
    
    const innerContainerStyle = useMemo<ViewStyle>(() => ({
        width: imageSize - borderWidth*2,
        height: imageSize - borderWidth*2,
        borderRadius: imageSize - borderWidth*2,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    }), [imageSize])

    const imageStyle = useMemo<ImageStyle>(() => ({
        width: realImageSize,
        height: realImageSize,
        borderRadius: realImageSize,
    }), [imageSize])

    return (
        <>
            <View style={innerContainerStyle}>
                {image ? (
                    <Image
                        source={image}
                        style={imageStyle}
                        recyclingKey={pubkey}
                    />
                ) : (
                    <View style={{ width: realImageSize, height: realImageSize, borderRadius: realImageSize, backgroundColor: `#${pubkey.slice(0, 6)}` }} />
                )}
            </View>
            {includeFlareLabel && flare && (
                <View style={styles.flareLabelContainer}>
                    <FlareLabel pubkey={pubkey} flare={flare} />
                </View>
            )}
        </>
    )
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