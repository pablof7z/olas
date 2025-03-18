import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as User from '@/components/ui/user';
import { Sticker } from '@/lib/story-editor/store/index';
import { NDKStoryStickerType, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import mentionStyles, { ExtendedViewStyle, getStyleFromName } from './styles';

interface MentionStickerViewProps {
    sticker: Sticker<NDKStoryStickerType.Pubkey>;
    fixedDimensions?: boolean;
}

export default function MentionStickerView({ sticker, fixedDimensions = false }: MentionStickerViewProps) {
    // Initialize containerSize with dimensions from sticker if fixedDimensions is true, otherwise empty
    const [containerSize, setContainerSize] = useState(fixedDimensions ? sticker.dimensions : { width: 0, height: 0 });
    
    // Get user data from sticker value or metadata
    // Since we're using the generic type, value is guaranteed to be NDKUser
    const ndkUser = sticker.value;
    let pubkey = ndkUser.pubkey;
    let userProfile = sticker.metadata?.profile;

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
    const avatarSize = fontSize + 8;

    // Create view style with appropriate dimensions based on fixedDimensions
    const viewStyle = {
        ...containerStyle,
        width: fixedDimensions ? containerSize.width : undefined,
        height: fixedDimensions ? containerSize.height : undefined,
        alignItems: fixedDimensions ? 'center' : containerStyle.alignItems,
        justifyContent: fixedDimensions ? 'center' : containerStyle.justifyContent,
    };

    // Handle container layout to measure available space
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        if (fixedDimensions) return;
        const { width, height } = event.nativeEvent.layout;
        console.log('handleLayout', { width, height });
        setContainerSize({ width, height });
    }, [fixedDimensions]);

    // Build the appropriate content with optional avatar
    const content = (
        <>
            {selectedStyle.avatarStyle && (
                <User.Avatar
                    pubkey={pubkey}
                    userProfile={userProfile}
                    imageSize={avatarSize}
                    canSkipBorder={true}
                    style={selectedStyle.avatarStyle as any}
                />
            )}
            {selectedStyle.nameStyle && <User.Name pubkey={pubkey} userProfile={userProfile} style={selectedStyle.nameStyle} />}
        </>
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
                    justifyContent: viewStyle.justifyContent
                }}
                colors={backgroundGradient.colors}
                start={backgroundGradient.start || { x: 0, y: 0 }}
                end={backgroundGradient.end || { x: 1, y: 1 }}
                onLayout={handleLayout}>
                {content}
            </LinearGradient>
        );
    }

    return <View style={viewStyle} onLayout={handleLayout}>{content}</View>;
}

const _styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
