import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom } from 'jotai';
import type { RefObject } from 'react';

type StickersBottomSheetRef = RefObject<BottomSheetModal> | null;

export const stickersSheetRefAtom = atom<StickersBottomSheetRef, [StickersBottomSheetRef], void>(
    null,
    (_get, set, value) => {
        set(stickersSheetRefAtom, value);
    }
);
