import { NDKStoryStickerType, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextStyle, StyleProp, LayoutChangeEvent } from 'react-native';

import mentionStyles, { ExtendedViewStyle, getStyleFromName, MentionStickerStyle } from './styles';

import * as User from '@/components/ui/user';
import { Sticker } from '@/lib/story-editor/store/index';

interface MentionStickerViewProps {
    sticker: Sticker<NDKStoryStickerType.Pubkey>;
    fixedDimensions?: boolean;
    onLayout?: (event: LayoutChangeEvent) => void;
}

export default function MentionStickerView({ sticker, fixedDimensions = false, onLayout }: MentionStickerViewProps) {
    // Initialize containerSize with dimensions from sticker if fixedDimensions is true, otherwise empty
    const [containerSize, setContainerSize] = useState(fixedDimensions ? sticker.dimensions : { width: 0, height: 0 });

    // Get user data from sticker value or metadata
    // Since we're using the generic type, value is guaranteed to be NDKUser
    const ndkUser = sticker.value;
    const pubkey = ndkUser.pubkey;
    const userProfile = sticker.metadata?.profile;

    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);
    console.log('selectedStyle', sticker.style, selectedStyle);

    // Get container style
    const containerStyle = selectedStyle.containerStyle as ExtendedViewStyle;

    // Check if we have a gradient background
    const hasBackgroundGradient = 'backgroundGradient' in containerStyle && !!containerStyle.backgroundGradient;

    // Calculate avatar size based on font size from name style
    const nameStyle = selectedStyle.nameStyle as TextStyle;
    const fontSize = nameStyle?.fontSize || 16;
    const avatarSize = selectedStyle.avatarStyle ? selectedStyle.avatarStyle.width : 24;

    // Create view style with appropriate dimensions based on fixedDimensions
    const viewStyle = {
        ...containerStyle,
        width: fixedDimensions ? containerSize.width : undefined,
        height: fixedDimensions ? containerSize.height : undefined,
        alignItems: fixedDimensions ? 'center' : containerStyle.alignItems,
        justifyContent: fixedDimensions ? 'center' : containerStyle.justifyContent,
    };

    // Handle container layout to measure available space
    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            onLayout?.(event);
            if (fixedDimensions) return;
            const { width, height } = event.nativeEvent.layout;
            console.log('handleLayout', { width, height });
            setContainerSize({ width, height });
        },
        [fixedDimensions, onLayout]
    );

    if (hasBackgroundGradient && containerStyle.backgroundGradient) {
        // Extract linear gradient props and regular style props
        const { backgroundGradient, ...restStyle } = containerStyle;

        return (
            <LinearGradient
                style={{
                    ...restStyle,
                    width: viewStyle.width,
                    height: viewStyle.height,
                    alignItems: viewStyle.alignItems,
                    justifyContent: viewStyle.justifyContent,
                }}
                colors={backgroundGradient.colors}
                start={backgroundGradient.start || { x: 0, y: 0 }}
                end={backgroundGradient.end || { x: 1, y: 1 }}
                onLayout={handleLayout}>
                <Content pubkey={pubkey} userProfile={userProfile} avatarSize={avatarSize} selectedStyle={selectedStyle} />
            </LinearGradient>
        );
    }

    console.log('viewStyle', viewStyle);

    return (
        <View style={viewStyle} onLayout={handleLayout}>
            <Content pubkey={pubkey} userProfile={userProfile} avatarSize={avatarSize} selectedStyle={selectedStyle} />
        </View>
    );
}

function Content({
    pubkey,
    userProfile,
    avatarSize,
    selectedStyle,
}: {
    pubkey: string;
    userProfile: NDKUser;
    avatarSize: number;
    selectedStyle: MentionStickerStyle;
}) {
    return (
        <>
            {selectedStyle.avatarStyle && (
                <User.Avatar
                    pubkey={pubkey}
                    userProfile={userProfile}
                    imageSize={avatarSize}
                    canSkipBorder
                    style={selectedStyle.avatarStyle as any}
                />
            )}
            {selectedStyle.nameStyle && <User.Name pubkey={pubkey} userProfile={userProfile} style={selectedStyle.nameStyle} />}
        </>
    );
}
const _styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
