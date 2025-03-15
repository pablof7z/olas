import React from 'react';
import Animated from 'react-native-reanimated';
import { Sticker } from '../../context/StickerContext';
import { getTextStickerStyleById } from '../../styles/textStickerStyles';

interface TextStickerProps {
    sticker: Sticker;
    textStyle?: any;
}

export default function TextSticker({ sticker, textStyle }: TextStickerProps) {
    const style = getTextStickerStyleById(sticker.styleId);
    const finalTextStyle = { ...style.style.text, ...textStyle };
    
    return (
        <Animated.Text style={finalTextStyle}>
            {sticker.content}
        </Animated.Text>
    );
} 