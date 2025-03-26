import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { Hexpubkey, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import Mention from '@/lib/mentions/search';
import { useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { sharedStyles } from '../styles';

interface MentionStickerInputProps {
    onStickerAdded: () => void;
}

export default function MentionStickerInput({ onStickerAdded }: MentionStickerInputProps) {
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
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.label}>Enter @ to mention someone</Text>
            <Mention
                placeholder="Type @ to mention someone..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoFocus
                onMentionSelect={handleProfileSelect}
                style={sharedStyles.input}
                suggestionsContainerStyle={sharedStyles.suggestionsContainer}
                mentionItemStyle={sharedStyles.mentionItem}
                mentionItemPressedStyle={sharedStyles.mentionItemPressed}
                mentionAvatarStyle={sharedStyles.mentionAvatar}
                mentionNameStyle={sharedStyles.mentionName}
                mentionHandleStyle={sharedStyles.mentionHandle}
                mentionTextContainerStyle={sharedStyles.mentionTextContainer}
                mentionLastItemStyle={sharedStyles.mentionItemLast}
            />
        </View>
    );
}
