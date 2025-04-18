import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import MentionSelector from './mention-selector';

import { useColorScheme } from '@/lib/useColorScheme';

export interface MentionBottomSheetRef {
    open: () => void;
    close: () => void;
}

interface MentionBottomSheetProps {
    onSelectUser: (profile: NDKUserProfile) => void;
}

const MentionBottomSheet = forwardRef<MentionBottomSheetRef, MentionBottomSheetProps>(
    ({ onSelectUser }, ref) => {
        const bottomSheetRef = useRef<BottomSheet>(null);
        const { colors } = useColorScheme();

        useImperativeHandle(ref, () => ({
            open: () => {
                bottomSheetRef.current?.expand();
            },
            close: () => {
                bottomSheetRef.current?.close();
            },
        }));

        const handleUserSelected = (profile: NDKUserProfile) => {
            onSelectUser(profile);
            bottomSheetRef.current?.close();
        };

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={['60%']}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
                )}
                handleIndicatorStyle={{ backgroundColor: colors.grey3 }}
                backgroundStyle={{ backgroundColor: colors.card }}
            >
                <View style={styles.container}>
                    <MentionSelector onSelectUser={handleUserSelected} />
                </View>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default MentionBottomSheet;
