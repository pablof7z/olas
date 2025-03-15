import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import * as User from '@/components/ui/user';
import { Sticker } from '../../context/StickerContext';
import { useUserProfile } from '@/hooks/user-profile';

interface MentionStickerProps {
    sticker: Sticker;
    textStyle: any;
}

export default function MentionSticker({ sticker, textStyle }: MentionStickerProps) {
    if (!sticker.metadata?.profile?.pubkey) return null;
    
    return (
        <View style={styles.container}>
            <User.Avatar 
                pubkey={sticker.metadata.profile.pubkey as string} 
                userProfile={sticker.metadata.profile}
                imageSize={24} 
                skipProxy={true} 
                style={styles.icon} 
            />
            <Animated.Text style={[textStyle, styles.text]}>
                {sticker.content}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        marginLeft: 8,
        fontSize: 24,
    },
}); 