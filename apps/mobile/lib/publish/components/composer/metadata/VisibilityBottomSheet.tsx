import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, {
    useCallback,
    useEffect,
    forwardRef,
    type RefObject,
    useMemo,
    useImperativeHandle,
    useRef,
} from 'react';
import { Dimensions, StyleSheet, type TextStyle, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { getVisibilityLabel } from '@/lib/utils/visibility';
import type { PostMetadata, VisibilityType } from '@/lib/publish/types';
import VisibilityExplanationBottomSheet, { type VisibilityExplanationBottomSheetRef } from './VisibilityExplanationBottomSheet';
import { valueSheetStyles } from './style';
import { useEditorStore } from '@/lib/publish/store/editor';

export const AUDIENCE_OPTIONS = [
    {
        label: getVisibilityLabel('media-apps'),
        value: 'media-apps' as const,
        description: 'More high-quality engagement, less reach'
    },
    {
        label: getVisibilityLabel('text-apps'),
        value: 'text-apps' as const,
        description: 'More reach, less high-quality engagement'
    },
];

// Atoms for state management
export const visibilityBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);

function VisibilityContent() {
    const { colors } = useColorScheme();
    const currentValue = useEditorStore((state) => state.visibility) || 'media-apps';
    const setVisibility = useEditorStore((state) => state.setVisibility);
    const bottomSheetRef = useAtomValue(visibilityBottomSheetRefAtom);
    const explanationSheetRef = useRef<VisibilityExplanationBottomSheetRef>(null);

    const handleSelect = useCallback(
        (value: VisibilityType) => {
            setVisibility(value);
            bottomSheetRef?.current?.dismiss();
        },
        [setVisibility, bottomSheetRef]
    );

    const handleShowExplanation = useCallback(() => {
        explanationSheetRef.current?.present();
    }, []);

    return (
        <View style={valueSheetStyles.contentContainer}>
            <View style={valueSheetStyles.headerContainer}>
                <View style={valueSheetStyles.titleContainer}>
                    <Text style={valueSheetStyles.title}>Visibility</Text>

                    <TouchableOpacity style={valueSheetStyles.helpLink} onPress={handleShowExplanation}>
                        <Text style={[valueSheetStyles.helpText, { color: colors.muted }]}>What is this?</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[valueSheetStyles.description, { color: colors.muted }]}>
                    Choose the type of app you want to target with this post.
                </Text>
            </View>

            

            <FlatList
                data={AUDIENCE_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <VisibilityOptionItem
                        label={item.label}
                        value={item.value}
                        description={item.description}
                        currentValue={currentValue}
                        onPress={() => handleSelect(item.value)}
                    />
                )}
                contentContainerStyle={valueSheetStyles.flatListContent}
            />

            <VisibilityExplanationBottomSheet ref={explanationSheetRef} />
        </View>
    );
}

function VisibilityOptionItem({
    label,
    value,
    description,
    currentValue,
    onPress,
}: {
    label: string;
    value: VisibilityType;
    description: string;
    currentValue: VisibilityType;
    onPress: () => void;
}) {
    const { colors } = useColorScheme();

    const style = useMemo(
        () => ({
            ...valueSheetStyles.optionItem,
            backgroundColor: currentValue === value ? colors.foreground : 'transparent',
        }),
        [currentValue, value, colors]
    );

    const descriptionStyle = useMemo<TextStyle>(
        () => ({
            ...valueSheetStyles.description,
            color: currentValue === value ? colors.background : colors.muted,
        }),
        [currentValue, value, colors]
    );

    const textStyle = useMemo<TextStyle>(
        () => ({
            fontWeight: currentValue === value ? '600' : '400',
            color: currentValue === value ? colors.background : colors.foreground,
        }),
        [currentValue, value, colors]
    );

    return (
        <TouchableOpacity onPress={onPress} style={style}>
            <Text style={textStyle}>{label}</Text>
            <Text style={descriptionStyle}>{description}</Text>
        </TouchableOpacity>
    );
}

export interface VisibilityBottomSheetProps {
    initialValue?: VisibilityType;
    onValueChange?: (value: VisibilityType) => void;
}

const MAX_HEIGHT = Dimensions.get('window').height * 0.8;

export interface VisibilityBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

const VisibilityBottomSheet = forwardRef<VisibilityBottomSheetRef, VisibilityBottomSheetProps>(
    ({ initialValue = 'media-apps', onValueChange }, ref) => {
        const sheetRef = useSheetRef();
        const setBottomSheetRef = useSetAtom(visibilityBottomSheetRefAtom);
        const visibility = useEditorStore((state) => state.visibility) || 'media-apps';
        const setVisibility = useEditorStore((state) => state.setVisibility);

        useImperativeHandle(
            ref,
            () => ({
                present: () => sheetRef.current?.present(),
                dismiss: () => sheetRef.current?.dismiss(),
            }),
            [sheetRef]
        );

        useEffect(() => {
            setBottomSheetRef(sheetRef);
        }, [setBottomSheetRef]);

        useEffect(() => {
            if (initialValue !== undefined && !visibility) {
                setVisibility(initialValue);
            }
        }, []);

        useEffect(() => {
            onValueChange?.(visibility);
        }, [visibility, onValueChange]);

        return (
            <Sheet ref={sheetRef} maxDynamicContentSize={MAX_HEIGHT} enablePanDownToClose>
                <BottomSheetView style={valueSheetStyles.container}>
                    <VisibilityContent />
                </BottomSheetView>
            </Sheet>
        );
    }
);

VisibilityBottomSheet.displayName = 'VisibilityBottomSheet';

export default VisibilityBottomSheet; 