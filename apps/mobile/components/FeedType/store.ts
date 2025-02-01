import { atom } from "jotai";

export type FeedKind = 'group' | 'hashtag' | 'discover';

export type FeedType = {
    kind: FeedKind;
    value: string;
    relayUrls?: string[];
}

export const feedTypeAtom = atom<FeedType, [FeedType | null], void>({
    kind: 'discover',
    value: 'for-you',
    relayUrls: [],
}, (get, set, feedType) => {
    set(feedTypeAtom, feedType);
});
