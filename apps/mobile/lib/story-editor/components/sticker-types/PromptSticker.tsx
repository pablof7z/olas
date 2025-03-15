import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Sticker } from '../../context/StickerContext';
import { getPromptStickerStyleById } from '../../styles/promptStickerStyles';

interface PromptStickerProps {
    sticker: Sticker;
    textStyle?: any;
}

export default function PromptSticker({ sticker, textStyle }: PromptStickerProps) {
    const [response, setResponse] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const style = getPromptStickerStyleById(sticker.styleId);
    
    const promptText = sticker.content;
    
    const handleSubmit = () => {
        if (response.trim()) {
            setSubmitted(true);
        }
    };
    
    return (
        <View style={style.style.container}>
            <Animated.Text 
                style={[
                    style.style.text, 
                    textStyle,
                    style.fontFamily ? { fontFamily: style.fontFamily } : {}
                ]}
            >
                {promptText}
            </Animated.Text>
            
            {!submitted ? (
                <>
                    <TextInput
                        style={style.style.input}
                        placeholder="Your answer..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={response}
                        onChangeText={setResponse}
                        multiline={false}
                    />
                    <TouchableOpacity 
                        style={style.style.button}
                        onPress={handleSubmit}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Animated.Text
                    style={[
                        style.style.text,
                        { fontSize: style.style.text.fontSize * 0.9, marginTop: 5 }
                    ]}
                >
                    Your answer: {response}
                </Animated.Text>
            )}
        </View>
    );
} 