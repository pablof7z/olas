import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';
import type { RefObject } from 'react';

export const optionsSheetRefAtom = atom<
    RefObject<BottomSheetModal> | null,
    [RefObject<BottomSheetModal> | null],
    void
>(null, (_get, set, value) => set(optionsSheetRefAtom, value));

export const optionsMenuEventAtom = atom<NDKEvent | null, [NDKEvent | null], void>(
    null,
    (_get, set, event) => set(optionsMenuEventAtom, event)
);
