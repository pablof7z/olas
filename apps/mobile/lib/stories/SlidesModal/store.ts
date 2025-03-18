import { atom } from 'jotai';
import { NDKImage, NDKStory, NDKVideo } from '@nostr-dev-kit/ndk-mobile';

// Re-export atoms from parent store
export { showStoriesModalAtom, storiesAtom } from '@/lib/stories/store';

// Local atoms for SlidesModal
export const isLoadingAtom = atom(false);
export const durationAtom = atom(-1);
export const activeSlideAtom = atom(0); 