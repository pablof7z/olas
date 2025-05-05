import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';
import LocationBottomSheet, { locationBottomSheetRefAtom } from './LocationBottomSheet';
import { iconSize, styles } from './style';

export default function Location() {
    const location = useEditorStore((state) => state.location);
    const includeLocation = useEditorStore((state) => state.includeLocation);
    const setIncludeLocation = useEditorStore((state) => state.setIncludeLocation);
    const { colors } = useColorScheme();
    const locationBottomSheetRef = useAtomValue(locationBottomSheetRefAtom);

    // Only render if location data exists
    if (!location) return null;

    const toggleIncludeLocation = () => {
        setIncludeLocation(!includeLocation);
    };

    const openLocationBottomSheet = () => {
        locationBottomSheetRef?.current?.present();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.rowContainer}
                onPress={openLocationBottomSheet}
                activeOpacity={0.7}
            >
                <Ionicons name="location-outline" size={iconSize} color={colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.foreground }]}>Location</Text>
                    <Text style={styles.subtitle}>Include location data with this post</Text>
                </View>
                <Switch
                    value={includeLocation}
                    onValueChange={toggleIncludeLocation}
                    trackColor={{ false: colors.grey3, true: colors.primary }}
                    ios_backgroundColor={colors.grey3}
                />
            </TouchableOpacity>

            <LocationBottomSheet ref={locationBottomSheetRef} />
        </View>
    );
}
