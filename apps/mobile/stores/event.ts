import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';

type ActiveEventType = NDKEvent | null;

export const activeEventAtom = atom<ActiveEventType, [ActiveEventType], null>(
    null,
    (_get, set, value) => set(activeEventAtom, value)
);
