import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Sticker } from '../../context/StickerContext';
import { getNostrFilterStickerStyleById } from '../../styles/nostrFilterStickerStyles';

interface NostrFilterStickerProps {
    sticker: Sticker;
    textStyle?: any;
}

export default function NostrFilterSticker({ sticker, textStyle }: NostrFilterStickerProps) {
    const style = getNostrFilterStickerStyleById(sticker.styleId);
    
    // Try to parse the filter content
    let filterObject;
    try {
        filterObject = JSON.parse(sticker.content);
    } catch (e) {
        // If it can't be parsed as JSON, just show it as text
        filterObject = null;
    }
    
    return (
        <View style={style.style.container}>
            {filterObject ? (
                <Animated.Text 
                    style={[
                        style.style.text, 
                        textStyle,
                        style.fontFamily ? { fontFamily: style.fontFamily } : {}
                    ]}
                >
                    {JSON.stringify(filterObject, null, 2)}
                </Animated.Text>
            ) : (
                <Animated.Text 
                    style={[
                        style.style.text, 
                        textStyle,
                        style.fontFamily ? { fontFamily: style.fontFamily } : {}
                    ]}
                >
                    {sticker.content}
                </Animated.Text>
            )}
        </View>
    );
} 