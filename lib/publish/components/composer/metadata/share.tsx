import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';
import { locationBottomSheetRefAtom } from './LocationBottomSheet';
import { iconSize, styles } from './style';

export default function ShareOptions() {
    const { colors } = useColorScheme();
    const share = useEditorStore((state) => state.share);
    const setShare = useEditorStore((state) => state.setShare);
    const visibility = useEditorStore((state) => state.visibility);
    const locationBottomSheetRef = useAtomValue(locationBottomSheetRefAtom);

    const openLocationBottomSheet = useCallback(() => {
        locationBottomSheetRef?.current?.present();
    }, [locationBottomSheetRef]);

    const handleShareToggle = useCallback(() => {
        setShare(!share);
    }, [share, setShare]);

    // Only show this component if visibility is 'media-apps'
    if (visibility !== 'media-apps') {
        return null;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.rowContainer}
                onPress={openLocationBottomSheet}
                activeOpacity={0.7}
            >
                <Ionicons name="person-outline" size={iconSize} color={colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.foreground }]}>
                        Share to all Nostr apps
                    </Text>
                    <Text style={styles.subtitle}>Increase visibility of this post</Text>
                </View>
                <Switch
                    value={share}
                    onValueChange={handleShareToggle}
                    trackColor={{ false: colors.grey3, true: colors.primary }}
                    ios_backgroundColor={colors.grey3}
                />
            </TouchableOpacity>
        </View>
    );
}
