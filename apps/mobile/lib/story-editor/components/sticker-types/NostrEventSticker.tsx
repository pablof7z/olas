import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../context/StickerContext';

interface NostrEventStickerProps {
    sticker: Sticker;
    textStyle: any;
}

export default function NostrEventSticker({ sticker, textStyle }: NostrEventStickerProps) {
    const iconColor = textStyle.color || 'white';
    
    return (
        <View style={styles.container}>
            <Ionicons 
                name="document-text" 
                size={24} 
                color={iconColor} 
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
        fontSize: 24,
    },
}); 