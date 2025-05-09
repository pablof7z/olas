import React from 'react';
import { Text, View } from 'react-native';

import { getStyleFromName } from './styles';

import type { Sticker } from '@/lib/story-editor/store/index';

interface PromptStickerViewProps {
    sticker: Sticker;
}

export default function PromptStickerView({ sticker }: PromptStickerViewProps) {
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);

    // Extract container and text styles from the selected style
    const { container, text } = selectedStyle;

    return (
        <View style={container}>
            <Text style={text}>{sticker.value}</Text>
        </View>
    );
}
