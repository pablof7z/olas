import { FlashList } from '@shopify/flash-list';
import { atom } from 'jotai';
import { RefObject } from 'react';

// Mutable atom initialized to `null`
export const homeScreenScrollRefAtom = atom<RefObject<FlashList<any>> | null, [RefObject<FlashList<any>> | null], void>(
    null,
    (get, set, value) => {
        set(homeScreenScrollRefAtom, value);
    }
);
