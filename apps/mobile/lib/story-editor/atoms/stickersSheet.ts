import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom } from 'jotai';
import { RefObject } from 'react';

type StickersBottomSheetRef = RefObject<BottomSheetModal> | null;

export const stickersSheetRefAtom = atom<StickersBottomSheetRef, [StickersBottomSheetRef], void>(null, (get, set, value) => {
    set(stickersSheetRefAtom, value);
});
