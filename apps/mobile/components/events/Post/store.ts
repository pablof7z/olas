import { atom } from 'jotai';
import { RefObject } from 'react';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';

export const optionsSheetRefAtom = atom<RefObject<BottomSheetModal> | null, [RefObject<BottomSheetModal> | null], void>(
    null,
    (get, set, value) => set(optionsSheetRefAtom, value)
);

export const optionsMenuEventAtom = atom<NDKEvent | null, [NDKEvent | null], void>(null, (get, set, event) =>
    set(optionsMenuEventAtom, event)
);
