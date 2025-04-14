import { atom } from 'jotai';

// Re-export atoms from parent store
export { showStoriesModalAtom, storiesAtom } from '@/lib/stories/store';

// Local atoms for SlidesModal
export const activeSlideAtom = atom(0);
