import React, { useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Hexpubkey, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import Mention from '@/lib/mentions/search';
import { useColorScheme } from '@/lib/useColorScheme';
import { useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';

interface MentionStickerInputProps {
    onStickerAdded: () => void;
}

export default function MentionStickerInput({ onStickerAdded }: MentionStickerInputProps) {
    const { colors } = useColorScheme();
    const { addSticker } = useStickerStore();
    const { ndk } = useNDK();

    const handleProfileSelect = useCallback(
        (pubkey: Hexpubkey, profile: NDKUserProfile) => {
            console.log('Profile selected:', profile);
            console.log('User pubkey:', pubkey);
            console.log('User profile:', profile);

            if (profile && pubkey && ndk) {
                const user = ndk.getUser({ pubkey });
                
                const stickerData = {
                    type: NDKStoryStickerType.Pubkey,
                    value: user,
                    metadata: { profile },
                    dimensions: { width: 150, height: 40 }, // Default dimensions for mention sticker
                };
                console.log('Creating mention sticker with profile:', profile);

                console.log('Adding sticker with data:', stickerData);
                const stickerId = addSticker(stickerData);
                console.log('Sticker added with ID:', stickerId);

                onStickerAdded();
            } else {
                console.error('Cannot create mention sticker: missing profile, pubkey, or NDK instance', {
                    hasProfile: !!profile,
                    hasPubkey: !!pubkey,
                    hasNDK: !!ndk,
                });
            }
        },
        [addSticker, onStickerAdded, ndk]
    );

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.foreground }]}>Enter @ to mention someone</Text>
            <Mention
                placeholder="Type @ to mention someone..."
                placeholderTextColor={colors.grey2}
                autoFocus
                onMentionSelect={handleProfileSelect}
                style={{
                    ...styles.input,
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.grey3,
                }}
                suggestionsContainerStyle={{
                    ...styles.suggestionsContainer,
                    backgroundColor: colors.card,
                    borderColor: colors.grey3,
                }}
            />
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
    },
});
