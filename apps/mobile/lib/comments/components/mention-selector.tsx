import type { Hexpubkey, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import MentionSuggestions from '@/lib/mentions/mention-suggestions';
import { useColorScheme } from '@/lib/useColorScheme';

interface MentionSelectorProps {
    onSelectUser: (profile: NDKUserProfile) => void;
}

export default function MentionSelector({ onSelectUser }: MentionSelectorProps) {
    const [searchQuery, setSearchQuery] = useState<string>('@');
    const { colors } = useColorScheme();

    const handleProfileSelected = (pubkey: Hexpubkey, profile: NDKUserProfile) => {
        onSelectUser({ ...profile, pubkey });
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.card,
                        color: colors.foreground,
                        borderColor: colors.grey3,
                    },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="@username"
                placeholderTextColor={colors.muted}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
            />
            <View style={styles.suggestionsContainer}>
                {searchQuery.length > 1 && (
                    <MentionSuggestions
                        query={searchQuery}
                        onPress={handleProfileSelected}
                        FlashListComponent={FlashList}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    input: {
        height: 46,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    suggestionsContainer: {
        flex: 1,
    },
});
