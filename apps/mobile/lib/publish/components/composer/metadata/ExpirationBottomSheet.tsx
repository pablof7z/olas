import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, {
    useCallback,
    useEffect,
    forwardRef,
    useImperativeHandle,
    type RefObject,
    useMemo,
} from 'react';
import { Dimensions, StyleSheet, type TextStyle, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { valueSheetStyles } from './style';

export const EXPIRATION_OPTIONS = [
    { label: 'No expiration', value: null },
    { label: '1 day', value: 24 * 60 * 60 },
    { label: '3 days', value: 3 * 24 * 60 * 60 },
    { label: '7 days', value: 7 * 24 * 60 * 60 },
    { label: '30 days', value: 30 * 24 * 60 * 60 },
];

// Atoms for state management
export const expirationBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);
export const expirationValueAtom = atom<number | null>(null);

function ExpirationContent() {
    const { colors } = useColorScheme();
    const [currentValue, setCurrentValue] = useAtom(expirationValueAtom);
    const bottomSheetRef = useAtomValue(expirationBottomSheetRefAtom);

    const handleSelect = useCallback(
        (value: number | null) => {
            setCurrentValue(value);
            bottomSheetRef?.current?.dismiss();
        },
        [setCurrentValue, bottomSheetRef]
    );

    return (
        <View style={valueSheetStyles.contentContainer}>
            <View style={valueSheetStyles.headerContainer}>
                <View style={valueSheetStyles.titleContainer}>
                    <Text style={valueSheetStyles.title}>Expiration</Text>
                </View>

                <Text style={[valueSheetStyles.description, { color: colors.muted }]}>
                    Relays and clients will be instructed to delete the post after the specified time.
                </Text>
            </View>

            <FlatList
                data={EXPIRATION_OPTIONS}
                keyExtractor={(item) => String(item.value)}
                renderItem={({ item }) => (
                    <ExpirationOptionItem
                        label={item.label}
                        value={item.value}
                        currentValue={currentValue}
                        onPress={() => handleSelect(item.value)}
                    />
                )}
                contentContainerStyle={valueSheetStyles.flatListContent}
            />
        </View>
    );
}

function ExpirationOptionItem({
    label,
    value,
    currentValue,
    onPress,
}: {
    label: string;
    value: number | null;
    currentValue: number | null;
    onPress: () => void;
}) {
    const { colors } = useColorScheme();

    const style = useMemo(
        () => ({
            ...styles.optionItem,
            backgroundColor: currentValue === value ? colors.foreground : 'transparent',
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
        </TouchableOpacity>
    );
}

export interface ExpirationBottomSheetProps {
    initialValue?: number | null;
    onValueChange?: (value: number | null) => void;
}

const MAX_HEIGHT = Dimensions.get('window').height * 0.8;

export interface ExpirationBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

const ExpirationBottomSheet = forwardRef<ExpirationBottomSheetRef, ExpirationBottomSheetProps>(
    ({ initialValue = null, onValueChange }, ref) => {
        const sheetRef = useSheetRef();
        const setBottomSheetRef = useSetAtom(expirationBottomSheetRefAtom);
        const [currentValue, setCurrentValue] = useAtom(expirationValueAtom);

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
            if (initialValue !== undefined) {
                setCurrentValue(initialValue);
            }
        }, []);

        useEffect(() => {
            onValueChange?.(currentValue);
        }, [currentValue, onValueChange]);

        return (
            <Sheet ref={sheetRef} maxDynamicContentSize={MAX_HEIGHT} enablePanDownToClose>
                <BottomSheetView style={styles.container}>
                    <ExpirationContent />
                </BottomSheetView>
            </Sheet>
        );
    }
);

ExpirationBottomSheet.displayName = 'ExpirationBottomSheet';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    optionItem: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    flatListContent: {
        paddingBottom: 24,
    },
});

export default ExpirationBottomSheet;
