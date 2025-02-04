import { feedTypeAtom } from '@/components/FeedType/store';
import { useAppSettingsStore } from '@/stores/app';
import { router } from 'expo-router';
import { atom, useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export const searchQueryAtom = atom<string | null, [string | null], void>(null, (get, set, query) => {
    set(searchQueryAtom, query);
});

export function useSearchQuery() {
    const savedSearches = useAppSettingsStore(state => state.savedSearches);
    const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
    const setFeedType = useSetAtom(feedTypeAtom);

    const set = useCallback((query: string | null) => {
        console.log('setting search query', query, !!query);
        if (query === null) {
            setSearchQuery(null);
        } else {
            setSearchQuery(query);

            if (router.canDismiss()) router.dismiss()
        }
    }, [savedSearches, setSearchQuery, setFeedType]);

    return set;
}