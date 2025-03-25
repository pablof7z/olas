import { atom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterList } from './components/FilterList';
import { RefObject } from 'react';

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
}

export default function FilterBottomSheet({ selectedFilterId, onSelectFilter, previewImageUri, visible }: FilterBottomSheetProps) {
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
    }, [visible]);

    return (
        <Sheet 
            ref={ref} 
            snapPoints={['50%']}
            enablePanDownToClose
            backgroundStyle={{ backgroundColor: '#111' }}
            handleIndicatorStyle={{ backgroundColor: '#333' }}
            style={{
                borderTopStartRadius: 16,
                borderTopEndRadius: 16,
            }}
        >
            <BottomSheetView style={{ 
                flexDirection: 'column', 
                width: '100%', 
                paddingBottom: insets.bottom 
            }}>
                <FilterList
                    selectedFilterId={selectedFilterId || ''}
                    onSelectFilter={onSelectFilter}
                    previewImageUri={previewImageUri}
                />
            </BottomSheetView>
        </Sheet>
    );
} 