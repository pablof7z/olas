import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { atom } from "jotai";

/**
 * The event that is being commented on, ideally a root event.
 */
export const rootEventAtom = atom<NDKEvent | null, [NDKEvent | null], null>(null, (get, set, value) => set(rootEventAtom, value));

/**
 * The event that is being replied to.
 */
export const replyEventAtom = atom<NDKEvent | null, [NDKEvent | null], null>(null, (get, set, value) => set(replyEventAtom, value));