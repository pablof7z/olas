import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { atom } from "jotai";

type EventAtom = NDKEvent | null;

/**
 * The event that is being commented on, ideally a root event.
 */
export const rootEventAtom = atom<EventAtom, [EventAtom], void>(null, (get, set, value) => set(rootEventAtom, value));

/**
 * The event that is being replied to.
 */
export const replyEventAtom = atom<EventAtom, [EventAtom], void>(null, (get, set, value) => set(replyEventAtom, value));

/**
 * The query for the mention suggestions.
 */
export const mentionQueryAtom = atom<string|null>(null);