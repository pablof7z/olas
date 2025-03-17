import { NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';

export const userBottomSheetAtom = atom<NDKUser | null, [NDKUser | null], void>(null, (get, set, user) => {
    set(userBottomSheetAtom, user);
});
