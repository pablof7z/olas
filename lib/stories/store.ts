import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { atom, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export const showStoriesModalAtom = atom(false);
export const storiesAtom = atom<NDKEvent[]>([]);

export function useStoriesView() {
    const setStories = useSetAtom(storiesAtom);
    const setShowStoriesModal = useSetAtom(showStoriesModalAtom);

    const open = useCallback(
        (events: NDKEvent[]) => {
            setStories(events);
            setShowStoriesModal(true);
        },
        [setStories, setShowStoriesModal]
    );

    return open;
}
