import { useSetAtom } from 'jotai';
import { Timer } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ExpirationBottomSheet, {
    EXPIRATION_OPTIONS,
    type ExpirationBottomSheetRef,
    expirationBottomSheetRefAtom,
} from './ExpirationBottomSheet';

import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';
import { iconSize, styles } from './style';

export default function Expiration() {
    const { colors } = useColorScheme();
    const expiration = useEditorStore((state) => state.expiration);
    const setExpiration = useEditorStore((state) => state.setExpiration);

    const bottomSheetRef = useRef<ExpirationBottomSheetRef>(null);
    const setExpirationBottomSheetRef = useSetAtom(expirationBottomSheetRefAtom);

    useEffect(() => {
        setExpirationBottomSheetRef(bottomSheetRef);
        return () => {
            setExpirationBottomSheetRef(null);
        };
    }, [setExpirationBottomSheetRef]);

    const getExpirationLabel = () => {
        if (expiration === null) return 'No expiration';
        const option = EXPIRATION_OPTIONS.find((opt) => opt.value === expiration);
        return option ? option.label : 'Custom';
    };

    const handleOpenBottomSheet = () => {
        bottomSheetRef.current?.present();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.rowContainer} onPress={handleOpenBottomSheet}>
                <Timer size={iconSize} color={colors.foreground} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.foreground }]}>Expiration</Text>
                    <Text style={styles.subtitle}>
                        Add an expiration date to your post.
                    </Text>
                </View>
                <Text style={[styles.value, { color: colors.foreground }]}>
                    {getExpirationLabel()}
                </Text>
            </TouchableOpacity>

            <ExpirationBottomSheet
                ref={bottomSheetRef}
                initialValue={expiration}
                onValueChange={setExpiration}
            />
        </View>
    );
}