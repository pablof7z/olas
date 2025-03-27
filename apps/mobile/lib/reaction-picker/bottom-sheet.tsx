import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ReactionPicker from './component';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';

type ReactionPickerCallback = (reaction: string) => void;
export const reactionPickerCallbackAtom = atom<ReactionPickerCallback | null, [ReactionPickerCallback], void>(null, (get, set, value) => {
    set(reactionPickerCallbackAtom, value);
});

export const sheetAtom = atom<BottomSheetModal, [BottomSheetModal], void>(null, (get, set, value) => {
    set(sheetAtom, value);
});

export default function ReactionPickerBottomSheet() {
    const sheetRef = useSheetRef();
    const setSheet = useSetAtom(sheetAtom);
    const reactionPickerCallback = useAtomValue(reactionPickerCallbackAtom);
    const inset = useSafeAreaInsets();

    useEffect(() => {
        setSheet(sheetRef.current);
    }, [sheetRef.current]);

    const onSelect = useCallback(
        (reaction: string) => {
            reactionPickerCallback?.(reaction);
            sheetRef.current?.dismiss();
        },
        [reactionPickerCallback, sheetRef.current]
    );

    return (
        <Sheet ref={sheetRef}>
            <BottomSheetView style={{ padding: 10, paddingBottom: inset.bottom, flex: 1 }}>
                <ReactionPicker onSelect={onSelect} />
            </BottomSheetView>
        </Sheet>
    );
}
