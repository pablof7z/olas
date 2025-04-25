import { useCallback, useEffect, useMemo } from 'react';

import { FILTER_PRESETS } from '../presets';
import { useMediaFilterStore } from '../store';
import { FilterParameters } from '../types';
import { saveFilteredImage } from '../utils/saveFilteredImage';

export function useMediaFilter() {
    const { sourceUri, currentFilter, applyFilter, clearFilter, updateFilterParams, setSource } =
        useMediaFilterStore();

    const currentFilterId = currentFilter?.id || 'normal';

    // Get current filter parameters
    const currentFilterParams = useMemo(() => {
        if (!currentFilter) {
            return FILTER_PRESETS.find((f) => f.id === 'normal')?.parameters || {};
        }
        return currentFilter.parameters;
    }, [currentFilter]);

    // Handle filter selection - don't clear filter when selecting 'normal' anymore
    // We'll only clear the filter when explicitly requested
    const selectFilter = useCallback(
        (filterId: string) => {
            if (!sourceUri) return;

            // Find the filter preset
            const filterPreset = FILTER_PRESETS.find((f) => f.id === filterId);
            if (filterPreset) {
                applyFilter(filterId, filterPreset.parameters);
            }
        },
        [sourceUri, applyFilter]
    );

    // Explicitly clear the filter (used by reset button)
    const resetFilter = useCallback(() => {
        clearFilter();
    }, [clearFilter]);

    // Handles saving a filtered image
    const saveImage = useCallback(async (): Promise<string | null> => {
        if (!sourceUri || !currentFilter) return null;

        try {
            const newUri = await saveFilteredImage(sourceUri, currentFilter.parameters);

            return newUri;
        } catch (error) {
            console.error('Error saving filtered image:', error);
            return null;
        }
    }, [sourceUri, currentFilter]);

    return {
        sourceUri,
        currentFilterId,
        currentFilterParams,
        selectFilter,
        resetFilter,
        updateFilterParams,
        setSource,
        saveImage,
        availableFilters: FILTER_PRESETS,
    };
}
