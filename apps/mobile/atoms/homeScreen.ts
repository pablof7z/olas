import type { FlashList } from '@shopify/flash-list';
import { atom } from 'jotai';
import type { RefObject } from 'react';

// Mutable atom initialized to `null`
export const homeScreenScrollRefAtom = atom<
    RefObject<FlashList<any>> | null,
    [RefObject<FlashList<any>> | null],
    void
>(null, (_get, set, value) => {
    set(homeScreenScrollRefAtom, value);
});
