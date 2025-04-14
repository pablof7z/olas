import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/lib/useColorScheme';
import { getVisibilityLabel } from '@/lib/utils/visibility';
import VisibilityBottomSheet, { type VisibilityBottomSheetRef } from './VisibilityBottomSheet';
import { iconSize, styles } from './style';
import { useEditorStore } from '@/lib/publish/store/editor';

export default function Visibility() {
    const { colors } = useColorScheme();
    const visibility = useEditorStore((state) => state.visibility);
    const bottomSheetRef = useRef<VisibilityBottomSheetRef>(null);

    const handlePress = () => {
        bottomSheetRef.current?.present();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.rowContainer} onPress={handlePress}>
                <Ionicons name="people" size={iconSize} color={colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.foreground }]}>Visibility</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Determine where your post is visible.
                    </Text>
                </View>
                <Text style={[styles.value, { color: colors.foreground }]}>
                    {getVisibilityLabel(visibility)}
                </Text>
            </TouchableOpacity>

            <VisibilityBottomSheet ref={bottomSheetRef} />
        </View>
    );
} 