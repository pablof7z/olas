import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { infoSheetStyles } from './style';

export interface VisibilityExplanationBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

const VisibilityExplanationBottomSheet = forwardRef<VisibilityExplanationBottomSheetRef>(
    (_, ref) => {
        const sheetRef = useSheetRef();
        const { colors } = useColorScheme();

        useImperativeHandle(
            ref,
            () => ({
                present: () => sheetRef.current?.present(),
                dismiss: () => sheetRef.current?.dismiss(),
            }),
            [sheetRef]
        );

        return (
            <Sheet ref={sheetRef} enablePanDownToClose>
                <BottomSheetView style={infoSheetStyles.container}>
                    <View style={infoSheetStyles.contentContainer}>
                        <Text style={infoSheetStyles.title}>Visibility Options</Text>

                        <View style={infoSheetStyles.section}>
                            <Text style={infoSheetStyles.optionTitle}>Media Apps</Text>
                            <Text style={[infoSheetStyles.description, { color: colors.muted }]}>
                                As a media post, your post will appear in visual-first apps. A
                                subset of apps can display these posts, but they are always
                                displayed within the context of people who want to see them.
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500' }}>
                                Publishes to apps like Olas.
                            </Text>
                        </View>

                        <View style={infoSheetStyles.section}>
                            <Text style={infoSheetStyles.optionTitle}>Text Apps</Text>
                            <Text style={[infoSheetStyles.description, { color: colors.muted }]}>
                                As a text post, your post will appear in text-first apps, in a
                                high-velocity feed. You will see more reach, but it will be mixed
                                with lower-quality posts from other users.
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500' }}>
                                Publishes to apps like Primal and Damus, as well as Olas.
                            </Text>
                        </View>
                    </View>
                </BottomSheetView>
            </Sheet>
        );
    }
);

VisibilityExplanationBottomSheet.displayName = 'VisibilityExplanationBottomSheet';

export default VisibilityExplanationBottomSheet;
