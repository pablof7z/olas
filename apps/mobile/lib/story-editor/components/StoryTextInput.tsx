import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useStickers } from '../context/StickerContext';
import { enhancedTextStyles } from '../styles/enhancedTextStyles';
import {
    useFonts,
    Inter_900Black,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    Pacifico_400Regular,
} from '@expo-google-fonts/pacifico';
import {
    PermanentMarker_400Regular,
} from '@expo-google-fonts/permanent-marker';
import {
    DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';

interface StoryTextInputProps {
    onClose: () => void;
}

export default function StoryTextInput({ onClose }: StoryTextInputProps) {
    const [text, setText] = useState('');
    const { addTextSticker } = useStickers();
    const insets = useSafeAreaInsets();
    const [fontsLoaded] = useFonts({
        Inter_900Black,
        Inter_700Bold,
        Pacifico_400Regular,
        PermanentMarker_400Regular,
        DancingScript_700Bold,
    });

    const handleDone = () => {
        if (text.trim()) {
            addTextSticker(text.trim());
            setText('');
        }
        onClose();
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        { fontFamily: enhancedTextStyles[0].fontFamily }
                    ]}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type something..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    autoFocus
                    maxLength={100}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerButton: {
        padding: 10,
    },
    headerButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    inputContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    input: {
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
    },
}); 