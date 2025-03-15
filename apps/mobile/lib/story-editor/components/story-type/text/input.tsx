import React from 'react';
import { View } from 'react-native';

interface TextStickerInputProps {
    onStickerAdded: () => void;
    addTextSticker: (text: string) => string;
}

export default function TextStickerInput({ onStickerAdded, addTextSticker }: TextStickerInputProps) {
    // Text sticker doesn't need an input UI, it's added directly
    React.useEffect(() => {
        addTextSticker('Tap to edit');
        onStickerAdded();
    }, []);
    
    return <View />;
} 