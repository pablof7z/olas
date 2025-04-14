import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { feedTypeAtom } from '@/components/FeedType/store';
import { searchQueryAtom } from '@/components/Headers/Home/store';
import { useAppSettingsStore } from '@/stores/app';

export function useIsSavedSearch() {
    const [feedType, _setFeedType] = useAtom(feedTypeAtom);
    const savedSearches = useAppSettingsStore((s) => s.savedSearches);
    const savedSearchHashtags = useMemo(
        () => new Set(savedSearches.map((s) => s.title)),
        [savedSearches]
    );
    const searchQuery = useAtomValue(searchQueryAtom);
    const ret = useMemo(
        () =>
            savedSearchHashtags.has(searchQuery) ||
            (feedType?.kind === 'search' && savedSearchHashtags.has(feedType?.value)),
        [searchQuery, savedSearchHashtags, feedType?.kind, feedType?.value]
    );

    return ret;
}
