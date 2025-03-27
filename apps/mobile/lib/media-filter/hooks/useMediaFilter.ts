import { useCallback, useMemo } from 'react';

import { FILTER_PRESETS } from '../presets';
import { useMediaFilterStore } from '../store';
import { FilterParameters } from '../types';
import { saveFilteredImage } from '../utils/saveFilteredImage';

export function useMediaFilter() {
    const { sourceUri, currentFilter, applyFilter, clearFilter, updateFilterParams, setSource } = useMediaFilterStore();

    const currentFilterId = currentFilter?.id || 'normal';

    // Get current filter parameters
    const currentFilterParams = useMemo(() => {
        if (!currentFilter) {
            return FILTER_PRESETS.find((f) => f.id === 'normal')?.parameters || {};
        }
        return currentFilter.parameters;
    }, [currentFilter]);

    // Handle filter selection
    const selectFilter = useCallback(
        (filterId: string) => {
            if (!sourceUri) return;

            console.log('Selecting filter:', {
                filterId,
                sourceUri,
                currentFilterId: currentFilter?.id,
            });

            if (filterId === 'normal') {
                clearFilter();
                return;
            }

            const filterPreset = FILTER_PRESETS.find((f) => f.id === filterId);
            if (filterPreset) {
                console.log('Applying filter:', {
                    filterId,
                    parameters: filterPreset.parameters,
                });
                applyFilter(filterId, filterPreset.parameters);
            }
        },
        [sourceUri, currentFilter, applyFilter, clearFilter]
    );

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
        updateFilterParams,
        setSource,
        saveImage,
        availableFilters: FILTER_PRESETS,
    };
}
