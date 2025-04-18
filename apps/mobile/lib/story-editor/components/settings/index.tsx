import { BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { settingsSheetRefAtom } from '../../atoms/settingsSheet';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';

export default function SettingsBottomSheet() {
    const sheetRef = useSheetRef();
    const setSettingsSheetRef = useSetAtom(settingsSheetRefAtom);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setSettingsSheetRef(sheetRef);

        return () => {
            setSettingsSheetRef(null);
        };
    }, [sheetRef, setSettingsSheetRef]);

    return (
        <Sheet
            ref={sheetRef}
            snapPoints={['50%']}
            backgroundComponent={({ style }) => (
                <BlurView intensity={90} tint="dark" style={[style, styles.sheetBlur]} />
            )}
            handleIndicatorStyle={styles.handleIndicator}
            style={styles.sheet}
        >
            <BottomSheetView style={[styles.container, { paddingBottom: insets.bottom }]}>
                <Text style={styles.text}>Hello world</Text>
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        borderWidth: 0,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    sheetBlur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 0,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    handleIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        width: 40,
        height: 4,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});
