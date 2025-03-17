import { atom } from 'jotai';
import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

export const productEventAtom = atom<NDKEvent | null, [NDKEvent | null], void>(null, (get, set, event) => {
    set(productEventAtom, event);
});
export const productViewSheetRefAtom = atom<React.RefObject<BottomSheetModal> | null, [React.RefObject<BottomSheetModal> | null], void>(
    null,
    (get, set, ref) => {
        set(productViewSheetRefAtom, ref);
    }
);
