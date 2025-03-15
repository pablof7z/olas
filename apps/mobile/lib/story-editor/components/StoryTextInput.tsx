import React from 'react';
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

interface StoryTextInputProps {
    initialText: string;
    onCancel: () => void;
    onDone: (text: string) => void;
}

export default function StoryTextInput({ initialText, onCancel, onDone }: StoryTextInputProps) {
    const [text, setText] = React.useState(initialText);
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDone(text)} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    multiline
                    autoFocus
                    placeholder="Enter text..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
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