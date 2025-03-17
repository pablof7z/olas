import { atom } from 'jotai';
import { RefObject } from 'react';
import { TextInput } from 'react-native';

export type FeedKind = 'group' | 'discover' | 'search';

export type FeedType = {
    kind: FeedKind;
    value?: string;
    relayUrls?: string[];
    hashtags?: string[];
};

export const feedTypeAtom = atom<FeedType, [FeedType | null], void>(
    {
        kind: 'discover',
        value: 'for-you',
        relayUrls: [],
    },
    (get, set, feedType) => {
        set(feedTypeAtom, feedType);
    }
);

type SearchInputRef = RefObject<TextInput> | null;
export const searchInputRefAtom = atom<SearchInputRef, [SearchInputRef | null], void>(null, (get, set, searchInputRef) => {
    set(searchInputRefAtom, searchInputRef);
});
