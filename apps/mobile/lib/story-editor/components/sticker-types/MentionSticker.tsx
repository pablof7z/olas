import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import * as User from '@/components/ui/user';
import { Sticker } from '../../context/StickerContext';
import { useUserProfile } from '@/hooks/user-profile';
import { getMentionStickerStyleById } from '../../styles/mentionStickerStyles';

interface MentionStickerProps {
    sticker: Sticker;
    textStyle?: any;
}

export default function MentionSticker({ sticker, textStyle }: MentionStickerProps) {
    if (!sticker.metadata?.profile?.pubkey) return null;
    
    const style = getMentionStickerStyleById(sticker.styleId);
    const finalTextStyle = { ...style.style.text, ...textStyle };
    
    // Get layout options from the style, with defaults
    const layout = style.layout || {
        direction: 'row',
        avatarSize: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8,
    };
    
    return (
        <View style={[
            style.style.container,
            {
                flexDirection: layout.direction,
                alignItems: layout.alignItems,
                justifyContent: layout.justifyContent,
                gap: layout.gap,
            }
        ]}>
            <User.Avatar 
                pubkey={sticker.metadata.profile.pubkey as string} 
                userProfile={sticker.metadata.profile}
                imageSize={layout.avatarSize} 
                skipProxy={true}
                canSkipBorder={true}
            />
            <Animated.Text 
                style={[finalTextStyle, style.fontFamily ? { fontFamily: style.fontFamily } : {}]}
            >
                {sticker.content}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        marginRight: 8,
    },
}); 