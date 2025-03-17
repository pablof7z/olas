import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as User from '@/components/ui/user';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import mentionStyles from './styles';

interface MentionStickerViewProps {
    sticker: Sticker;
}

// Extend ViewStyle with backgroundGradient property
interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: {
        colors: string[];
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
}

export default function MentionStickerView({ sticker }: MentionStickerViewProps) {
    // Get user data from sticker metadata
    const userProfile = sticker.metadata?.profile;
    const pubkey = userProfile?.pubkey;

    // Get the selected style or default to the first one if not set
    const selectedStyle = mentionStyles.find((style) => style.name === sticker.style) || mentionStyles[0];

    // Create container styles based on the selected style
    const containerStyle = selectedStyle.containerStyle as ExtendedViewStyle;

    // Check if we have a gradient background
    const hasBackgroundGradient =
        containerStyle.backgroundGradient &&
        Array.isArray(containerStyle.backgroundGradient.colors) &&
        containerStyle.backgroundGradient.colors.length > 1;

    // Get basic styling properties
    const backgroundColor = containerStyle.backgroundColor || 'rgba(0, 0, 0, 0.6)';
    const borderRadius = typeof containerStyle.borderRadius === 'number' ? containerStyle.borderRadius : 16;
    const borderWidth = containerStyle.borderWidth || 0;
    const borderColor = containerStyle.borderColor || 'transparent';
    const borderStyle = containerStyle.borderStyle || 'solid';
    const padding = typeof containerStyle.padding === 'number' ? containerStyle.padding : 10;

    // Shadow properties
    const shadowColor = containerStyle.shadowColor || 'transparent';
    const shadowOffset = containerStyle.shadowOffset || { width: 0, height: 0 };
    const shadowOpacity = containerStyle.shadowOpacity || 0;
    const shadowRadius = containerStyle.shadowRadius || 0;
    const elevation = containerStyle.elevation || 0;

    // Create text styles based on the selected style
    const nameStyle = (selectedStyle.nameStyle as TextStyle) || {};

    // Text style properties
    const textColor = nameStyle.color || 'white';
    const fontSize = nameStyle.fontSize || 16;
    const fontWeight = nameStyle.fontWeight || 'bold';
    const fontStyle = nameStyle.fontStyle || 'normal';

    // Text shadow properties
    const textShadowColor = nameStyle.textShadowColor || 'transparent';
    const textShadowOffset = nameStyle.textShadowOffset || { width: 0, height: 0 };
    const textShadowRadius = nameStyle.textShadowRadius || 0;

    // Calculate avatar size based on font size or use default
    const avatarSize = (fontSize || 16) + 8;

    // Create base view style
    const viewStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        padding,
        borderRadius,
        borderWidth,
        borderColor,
        borderStyle: borderStyle as any,
        backgroundColor: hasBackgroundGradient ? 'transparent' : backgroundColor,
        shadowColor,
        shadowOffset,
        shadowOpacity,
        shadowRadius,
        elevation,
    };

    // Create formatted text style
    const formattedTextStyle: TextStyle = {
        color: textColor,
        fontSize,
        fontWeight,
        fontStyle,
        textShadowColor,
        textShadowOffset,
        textShadowRadius,
    };

    // Ensure we have at least two colors for LinearGradient if using gradient
    const gradientColors = containerStyle.backgroundGradient?.colors || [];
    const defaultColors = ['#000000', '#000000'] as const;

    // Create a tuple of at least two colors
    const safeGradientColors = gradientColors.length >= 2 ? ([gradientColors[0], gradientColors[1]] as const) : defaultColors;

    if (!pubkey) return null;

    // Build the appropriate content with optional avatar
    const content = (
        <>
            {selectedStyle.avatarStyle !== false && (
                <User.Avatar
                    pubkey={pubkey}
                    userProfile={userProfile}
                    imageSize={avatarSize}
                    canSkipBorder={true}
                    style={{ marginRight: 6 }}
                />
            )}
            {selectedStyle.nameStyle !== false && <User.Name pubkey={pubkey} userProfile={userProfile} style={formattedTextStyle} />}
        </>
    );

    if (hasBackgroundGradient && containerStyle.backgroundGradient) {
        return (
            <LinearGradient
                style={viewStyle}
                colors={safeGradientColors}
                start={containerStyle.backgroundGradient.start || { x: 0, y: 0 }}
                end={containerStyle.backgroundGradient.end || { x: 1, y: 1 }}>
                {content}
            </LinearGradient>
        );
    }

    return <View style={viewStyle}>{content}</View>;
}
