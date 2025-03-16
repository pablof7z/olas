import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as User from '@/components/ui/user';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@/lib/story-editor/types';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import mentionStyles from './styles';

interface MentionStickerViewProps {
    sticker: Sticker;
}

export default function MentionStickerView({ sticker }: MentionStickerViewProps) {
    // Get user data from sticker metadata
    const userProfile = sticker.metadata?.profile;
    const pubkey = userProfile?.pubkey;
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStickerStyle(
        sticker.type === NDKStoryStickerType.Pubkey ? NDKStoryStickerType.Pubkey : NDKStoryStickerType.Mention, 
        sticker.styleId
    ) || mentionStyles[0];
    
    // Create container styles based on the selected style
    const containerStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 10,
        backgroundColor: selectedStyle.backgroundColor || 'rgba(0, 0, 0, 0.6)',
        borderRadius: selectedStyle.borderRadius || 16,
        borderWidth: selectedStyle.borderWidth,
        borderColor: selectedStyle.borderColor,
        borderStyle: selectedStyle.borderStyle as any,
        shadowColor: selectedStyle.shadowColor,
        shadowOffset: selectedStyle.shadowOffset,
        shadowOpacity: selectedStyle.shadowOpacity,
        shadowRadius: selectedStyle.shadowRadius,
        elevation: selectedStyle.elevation,
    };
    
    // Create text styles based on the selected style
    const textStyle = {
        color: selectedStyle.color || 'white',
        fontSize: selectedStyle.fontSize || 16,
        fontWeight: selectedStyle.fontWeight || 'bold',
        fontStyle: selectedStyle.fontStyle as any,
        textShadowColor: selectedStyle.textShadowColor,
        textShadowOffset: selectedStyle.textShadowOffset,
        textShadowRadius: selectedStyle.textShadowRadius,
    };
    
    // Avatar size based on font size
    const avatarSize = (selectedStyle.fontSize || 16) + 8;

    if (!pubkey) return null;
    
    return (
        <View style={containerStyle}>
            <User.Avatar 
                pubkey={pubkey}
                userProfile={userProfile} 
                imageSize={avatarSize}
                canSkipBorder={true}
                style={{ marginRight: 6 }}
            />
            <User.Name 
                pubkey={pubkey}
                userProfile={userProfile}
                style={textStyle}
            />
        </View>
    );
}
