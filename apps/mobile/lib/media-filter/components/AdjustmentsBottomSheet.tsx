import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useSetAtom } from 'jotai';
import { type RefObject, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterAdjustments } from './FilterAdjustments';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';

type AdjustmentsBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const adjustmentsBottomSheetRefAtom = atom<
    AdjustmentsBottomSheetRefAtomType,
    [AdjustmentsBottomSheetRefAtomType],
    void
>(null, (_get, set, value) => {
    set(adjustmentsBottomSheetRefAtom, value);
});

interface AdjustmentsBottomSheetProps {
    visible?: boolean;
}

export default function AdjustmentsBottomSheet({ visible }: AdjustmentsBottomSheetProps) {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(adjustmentsBottomSheetRefAtom);
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
            <BottomSheetView
                style={{
                    flexDirection: 'column',
                    width: '100%',
                    paddingBottom: insets.bottom,
                }}
            >
                <FilterAdjustments />
            </BottomSheetView>
        </Sheet>
    );
}
