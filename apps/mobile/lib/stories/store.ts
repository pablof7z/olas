import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { atom, useAtom } from "jotai";

export const showStoriesModalAtom = atom(false);
export const storiesAtom = atom<NDKEvent[]>([]);
