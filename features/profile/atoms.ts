import type { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';

// Atom for profile content view (photos, reels, posts, products)
export const profileContentViewAtom = atom<string>('photos');

// Atoms for profile editing state
export const editStateAtom = atom<string | null>(null);
export const editProfileAtom = atom<NDKUserProfile | null>(null);
