import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import MentionSuggestions from './mention-suggestions';
import { useColorScheme } from '@/lib/useColorScheme';

interface MentionProps extends TextInputProps {
    onMentionSelect?: (pubkey: Hexpubkey, profile: NDKUserProfile) => void;
    CustomInput?: React.ComponentType<TextInputProps>;
    suggestionsContainerStyle?: ViewStyle;
    mentionSuggestionsStyle?: ViewStyle;
}

const Mention = forwardRef<TextInput, MentionProps>(
    ({ onMentionSelect, CustomInput, suggestionsContainerStyle, mentionSuggestionsStyle, style, ...restProps }, ref) => {
        const { colors } = useColorScheme();
        const [text, setText] = useState<string>('');
        const localInputRef = useRef<TextInput>(null);

        const handleTextChange = (value: string) => {
            setText(value);

            // Call the original onChangeText if provided
            if (restProps.onChangeText) {
                restProps.onChangeText(value);
            }
        };

        const handleProfileSelect = useCallback(
            (pubkey: Hexpubkey, profile: NDKUserProfile) => {
                // Hide suggestions after selection
                // Call the callback if provided
                if (onMentionSelect) {
                    onMentionSelect(pubkey, profile);
                }
            },
            [onMentionSelect]
        );

        const inputStyles = [
            styles.input,
            {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.grey3,
            },
            style,
        ];

        const inputProps = {
            style: inputStyles,
            value: text,
            onChangeText: handleTextChange,
            autoCapitalize: 'none' as const,
            autoCorrect: false,
            ...restProps,
        };

        return (
            <View style={styles.container}>
                {CustomInput ? <CustomInput {...inputProps} /> : <TextInput ref={ref} {...inputProps} />}

                <View
                    style={[
                        styles.suggestionsContainer,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.grey3,
                        },
                        suggestionsContainerStyle,
                    ]}>
                    <MentionSuggestions
                        query={text.substring(text.lastIndexOf('@'))}
                        onPress={handleProfileSelect}
                        style={mentionSuggestionsStyle}
                    />
                </View>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
    },
    suggestionsContainer: {
        marginTop: 8,
        height: 200,
        minHeight: 100,
        width: '100%',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default Mention;
