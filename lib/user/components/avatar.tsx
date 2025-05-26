import useImageLoader from '@/lib/image-loader/hook';
import type { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image, type ImageProps, useImage } from 'expo-image';
import React, { type ForwardedRef, forwardRef, useMemo } from 'react';
import {
    type ImageSourcePropType,
    type ImageStyle,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';

import FlareLabel, { FlareElement } from './flare';

import { useColorScheme } from '@/lib/useColorScheme';

interface AvatarProps extends Omit<ImageProps, 'style'> {
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

    /**
     * Style prop for the container View
     */
    style?: StyleProp<ViewStyle>;
}

const UserAvatar = forwardRef(function UserAvatar(
    {
        pubkey,
        userProfile,
        flare,
        borderWidth,
        imageSize = 128,
        includeFlareLabel = false,
        canSkipBorder = false,
        skipProxy = false,
        borderColor,
        style: externalStyle,
        ...props
    }: AvatarProps,
    ref: ForwardedRef<View>
) {
    const { colors } = useColorScheme();
    const size = 128;
    imageSize ??= size / 3;
    borderWidth ??= imageSize / 16;

    // Use the new preloading hook for avatar image
    const avatarUrl = userProfile?.picture ?? null;
    const image = useImage({ uri: avatarUrl ?? undefined });
    // const { image } = useImageLoader(avatarUrl ?? false, {
    //     reqWidth: imageSize,
    // });
    // const image = useImage(avatarUrl, {}, [avatarUrl])

    borderColor ??= colors.card;

    const style = useMemo<ViewStyle>(
        () => ({
            ...styles.container,
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize,
        }),
        [imageSize]
    );

    const flareBorderContainerStyle = useMemo<ViewStyle>(
        () => ({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: imageSize,
            overflow: 'hidden',
        }),
        [imageSize, borderWidth, borderColor]
    );

    if (!pubkey) {
        alert('no pubkey was passed to the UserAvatar component! This is a bug');
        return null;
    }

    return (
        <View ref={ref} style={[style, externalStyle]}>
            {flare && (
                <View style={flareBorderContainerStyle}>
                    <FlareElement flare={flare} size={imageSize} borderWidth={borderWidth} />
                </View>
            )}
            <AvatarInner
                image={image}
                pubkey={pubkey}
                imageSize={imageSize}
                borderWidth={borderWidth}
                canSkipBorder={canSkipBorder}
                flare={flare}
                borderColor={borderColor}
                includeFlareLabel={includeFlareLabel}
                style={externalStyle}
                {...props}
            />
        </View>
    );
});

type AvatarInnerProps = {
    image: ImageSourcePropType | null | undefined;
    pubkey: string;
    imageSize: number;
    borderWidth: number;
    includeFlareLabel: boolean;
    canSkipBorder: boolean;
    flare: string | null | undefined;
    borderColor: string;
    style?: StyleProp<ViewStyle>;
};

function AvatarInner({
    image,
    pubkey,
    imageSize,
    borderWidth,
    canSkipBorder,
    flare,
    borderColor,
    includeFlareLabel,
    style: externalStyle,
    ...props
}: AvatarInnerProps) {
    let imageMargin = borderWidth;
    let realImageSize = imageSize - borderWidth * 2 - imageMargin * 2;

    if (canSkipBorder && !flare) {
        borderWidth = 0;
        imageMargin = 0;
        realImageSize = imageSize;
    }

    const innerContainerStyle = useMemo<ViewStyle>(
        () => ({
            width: imageSize - borderWidth * 2,
            height: imageSize - borderWidth * 2,
            borderRadius: imageSize - borderWidth * 2,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: `#${pubkey.slice(0, 6)}`,
        }),
        [imageSize]
    );

    const imageStyle = useMemo<ImageStyle>(
        () => ({
            width: realImageSize,
            height: realImageSize,
            borderRadius: realImageSize,
        }),
        [imageSize]
    );

    return (
        <>
            <View style={[innerContainerStyle, externalStyle]}>
                {image ? (
                    <Image source={image} style={imageStyle} recyclingKey={pubkey} />
                ) : (
                    <View
                        style={{
                            width: realImageSize,
                            height: realImageSize,
                            borderRadius: realImageSize,
                        }}
                    />
                )}
            </View>
            {includeFlareLabel && flare && (
                <View style={styles.flareLabelContainer}>
                    <FlareLabel pubkey={pubkey} flare={flare} />
                </View>
            )}
        </>
    );
}

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
    },
});
