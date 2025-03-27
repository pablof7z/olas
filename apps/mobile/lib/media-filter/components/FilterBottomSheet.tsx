import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { atom, useSetAtom } from 'jotai';
import { useCallback, useEffect, RefObject } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterList } from './FilterList';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';

type FilterBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const filterBottomSheetRefAtom = atom<FilterBottomSheetRefAtomType, [FilterBottomSheetRefAtomType], void>(
    null,
    (get, set, value) => {
        set(filterBottomSheetRefAtom, value);
    }
);

interface FilterBottomSheetProps {
    selectedFilterId: string | null;
    onSelectFilter: (filterId: string) => void;
    previewImageUri: string;
    visible?: boolean;
    onFilterApplied?: (newUri: string) => void;
    onResetFilter?: () => void;
    isApplying?: boolean;
    handleSaveFilteredImage?: () => Promise<string | undefined>;
    onDismiss?: () => void;
}

export default function FilterBottomSheet({
    selectedFilterId,
    onSelectFilter,
    previewImageUri,
    visible,
    onFilterApplied,
    onResetFilter,
    isApplying = false,
    handleSaveFilteredImage,
    onDismiss,
}: FilterBottomSheetProps) {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(filterBottomSheetRefAtom);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    useEffect(() => {
        if (visible) {
            ref.current?.present();
        } else {
            ref.current?.dismiss();
        }
    }, [visible, ref]);

    const handleApplyFilter = async () => {
        // Dismiss the sheet immediately when Apply is clicked
        ref.current?.dismiss();

        if (handleSaveFilteredImage) {
            const newUri = await handleSaveFilteredImage();
            if (newUri && onFilterApplied) {
                onFilterApplied(newUri);
            }
        }
    };

    const handleReset = () => {
        if (onResetFilter) {
            onResetFilter();
        }
    };

    const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} />, []);

    return (
        <Sheet
            ref={ref}
            enablePanDownToClose
            backgroundStyle={{ backgroundColor: '#111' }}
            handleIndicatorStyle={{ backgroundColor: '#333' }}
            backdropComponent={renderBackdrop}
            style={{
                borderTopStartRadius: 16,
                borderTopEndRadius: 16,
            }}
            onDismiss={onDismiss}>
            <BottomSheetView
                style={{
                    flexDirection: 'column',
                    width: '100%',
                    paddingBottom: insets.bottom,
                }}>
                <View style={styles.actionButtonsContainer}>
                    <Pressable onPress={handleReset} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Reset</Text>
                    </Pressable>

                    <Pressable onPress={handleApplyFilter} style={styles.actionButton} disabled={isApplying}>
                        <Text style={styles.actionButtonText}>{isApplying ? 'Applying...' : 'Apply'}</Text>
                    </Pressable>
                </View>

                <FilterList selectedFilterId={selectedFilterId || ''} onSelectFilter={onSelectFilter} previewImageUri={previewImageUri} />
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: -10,
        width: '100%',
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});
