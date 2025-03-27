import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import MentionBottomSheet, { MentionBottomSheetRef } from './mention-bottom-sheet';

import { useColorScheme } from '@/lib/useColorScheme';

interface MentionButtonProps {
    onSelectUser: (profile: NDKUserProfile) => void;
}

export default function MentionButton({ onSelectUser }: MentionButtonProps) {
    const { colors } = useColorScheme();
    const bottomSheetRef = useRef<MentionBottomSheetRef>(null);

    const handlePress = () => {
        bottomSheetRef.current?.open();
    };

    return (
        <>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.grey5 }]} onPress={handlePress}>
                <Text style={[styles.buttonText, { color: colors.foreground }]}>@Mention</Text>
            </TouchableOpacity>

            <MentionBottomSheet ref={bottomSheetRef} onSelectUser={onSelectUser} />
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
