import React from 'react';
import Animated from 'react-native-reanimated';
import { Sticker } from '../../context/StickerContext';

interface TextStickerProps {
    sticker: Sticker;
    textStyle: any;
}

export default function TextSticker({ sticker, textStyle }: TextStickerProps) {
    return (
        <Animated.Text style={textStyle}>
            {sticker.content}
        </Animated.Text>
    );
} 