import type { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';

export const editStateAtom = atom<string | null>(null);
export const editProfileAtom = atom<NDKUserProfile | null>(null);
