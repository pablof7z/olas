import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { locationBottomSheetRefAtom } from '@/lib/publish/components/composer/metadata/LocationBottomSheet';
import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';

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
                <Ionicons name="location-outline" size={22} color={colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Location</Text>
                    <Text style={styles.subtitle}>Include location data with this post</Text>
                </View>
                <Switch
                    value={includeLocation}
                    onValueChange={toggleIncludeLocation}
                    trackColor={{ false: colors.grey3, true: colors.primary }}
                    ios_backgroundColor={colors.grey3}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 2,
    },
});
