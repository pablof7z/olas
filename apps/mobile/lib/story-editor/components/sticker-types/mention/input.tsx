import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Hexpubkey, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import MentionSuggestions from '@/lib/comments/components/mention-suggestions';
import { useColorScheme } from '@/lib/useColorScheme';
import { useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { UserProfile } from '@/hooks/user-profile';

interface MentionStickerInputProps {
    onStickerAdded: () => void;
}

export default function MentionStickerInput({ 
    onStickerAdded
}: MentionStickerInputProps) {
    const { colors } = useColorScheme();
    const { addSticker } = useStickerStore();
    const [text, setText] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const inputRef = useRef<TextInput>(null);

    const handleTextChange = (value: string) => {
        setText(value);
        setShowSuggestions(true);
    };

    const handleProfileSelect = useCallback((pubkey: Hexpubkey, profile: NDKUserProfile) => {
        console.log('Profile selected:', profile);
        console.log('User pubkey:', pubkey);
        console.log('User profile:', profile);
        
        if (profile && pubkey) {
            const stickerData = {
                type: NDKStoryStickerType.Pubkey,
                value: pubkey,
                metadata: { profile: {...profile, pubkey} }
            };
            console.log('Creating mention sticker with profile:', profile);
            
            console.log('Adding sticker with data:', stickerData);
            const stickerId = addSticker(stickerData);
            console.log('Sticker added with ID:', stickerId);
            
            onStickerAdded();
        } else {
            console.error('Cannot create mention sticker: missing profile or pubkey', {
                hasProfile: !!profile,
                hasPubkey: !!pubkey
            });
        }
    }, [addSticker, onStickerAdded]);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.foreground }]}>
                Enter @ to mention someone
            </Text>
            <TextInput
                ref={inputRef}
                style={[
                    styles.input,
                    { 
                        backgroundColor: colors.card,
                        color: colors.foreground,
                        borderColor: colors.grey3
                    }
                ]}
                value={text}
                onChangeText={handleTextChange}
                placeholder="Type @ to mention someone..."
                placeholderTextColor={colors.grey2}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
            />
            
            {showSuggestions && (
                <View style={[
                    styles.suggestionsContainer,
                    { 
                        backgroundColor: colors.card,
                        borderColor: colors.grey3
                    }
                ]}>
                    <MentionSuggestions 
                        query={text}
                        onPress={handleProfileSelect}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
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
    }
}); 