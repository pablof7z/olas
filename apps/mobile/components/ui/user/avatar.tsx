import React, { memo, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Image, ImageProps, useImage } from 'expo-image';
import { BlurMask, Canvas, Rect, SweepGradient, vec } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import FlareLabel, { FlareElement } from './flare';
interface AvatarProps extends ImageProps {
    pubkey: Hexpubkey;
    userProfile: NDKUserProfile | null;
    imageSize?: number;
    borderWidth?: number;
    flare?: string | null;
    includeFlareLabel?: boolean;
}

const UserAvatar: React.FC<AvatarProps> = ({ pubkey, userProfile, flare, borderWidth = 4, imageSize = 128, includeFlareLabel = false, ...props }) => {
    const size = 128;
    imageSize ??= size / 3;

    const proxiedImageUrl: string | null = userProfile?.picture ? getProxiedImageUrl(userProfile.picture, size) : null;

    

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

    const imageMargin = borderWidth*0.75;
    const realImageSize = imageSize - borderWidth * 2 - imageMargin * 2;

    if (flare) {
        return (<View>
            <View
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: imageSize, height: imageSize, borderRadius: imageSize, overflow: 'hidden', position: 'relative' }}
            >
                <FlareElement flare={flare} size={imageSize} />

                <View
                    style={{ width: imageSize-borderWidth*2, height: imageSize-borderWidth*2, borderRadius: imageSize, borderWidth: imageMargin, borderColor: 'white', overflow: 'hidden'}}
                >
                    <Image
                        source={imageSource}
                        recyclingKey={pubkey}
                        style={{ width: realImageSize, height: realImageSize, borderRadius: imageSize }}
                        className="flex-1"
                    />
                </View>
                </View>
                {includeFlareLabel && (
                    <View style={styles.flareLabelContainer}>
                        <FlareLabel pubkey={pubkey} flare={flare} />
                    </View>
                )}
            </View>
        );
    }

    return (<View
        style={{ padding: borderWidth + imageMargin, width: imageSize, height: imageSize, overflow: 'hidden', position: 'relative' }}
    >
            <Image
                source={imageSource}
                recyclingKey={pubkey}
                style={{ width: realImageSize, height: realImageSize, borderRadius: imageSize }}
                className="flex-1"
            />
    </View>
    );
};

export default UserAvatar;

const styles = StyleSheet.create({
    flareLabelContainer: {
        position: 'absolute',
        bottom: -4,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    }
});