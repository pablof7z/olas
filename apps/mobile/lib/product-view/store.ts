import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';

export const productEventAtom = atom<NDKEvent | null, [NDKEvent | null], void>(
    null,
    (_get, set, event) => {
        set(productEventAtom, event);
    }
);
export const productViewSheetRefAtom = atom<
    React.RefObject<BottomSheetModal> | null,
    [React.RefObject<BottomSheetModal> | null],
    void
>(null, (_get, set, ref) => {
    set(productViewSheetRefAtom, ref);
});
