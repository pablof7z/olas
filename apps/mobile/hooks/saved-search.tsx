import { searchQueryAtom } from "@/components/Headers/Home/store";
import { useAppSettingsStore } from "@/stores/app";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

export function useIsSavedSearch() {
    const savedSearches = useAppSettingsStore(s => s.savedSearches);
    const savedSearchHashtags = useMemo(() => new Set(savedSearches.map(s => s.title)), [savedSearches]);
    const searchQuery = useAtomValue(searchQueryAtom);
    return useMemo(() => savedSearchHashtags.has(searchQuery), [searchQuery, savedSearchHashtags])
}