import { useCallback, useMemo } from 'react';
import { useEditorStore } from '@/lib/publish/store/editor';
import { FILTER_PRESETS, FilterParameters } from '../presets';

export function useFilter() {
    const { 
        selectedMedia, 
        selectedMediaIndex, 
        applyFilter, 
        clearFilter 
    } = useEditorStore();
    
    const currentMedia = selectedMedia[selectedMediaIndex];
    const currentFilterId = currentMedia?.filter?.id || 'normal';
    
    // Get current filter parameters
    const currentFilterParams = useMemo(() => {
        if (!currentMedia?.filter) {
            return FILTER_PRESETS.find(f => f.id === 'normal')?.parameters || {};
        }
        return currentMedia.filter.parameters;
    }, [currentMedia]);
    
    // Handle filter selection
    const selectFilter = useCallback((filterId: string) => {
        if (!currentMedia) return;
        
        console.log('Selecting filter:', {
            filterId,
            mediaId: currentMedia.id,
            currentFilterId: currentMedia?.filter?.id
        });
        
        if (filterId === 'normal') {
            clearFilter(currentMedia.id);
            return;
        }
        
        const filterPreset = FILTER_PRESETS.find(f => f.id === filterId);
        if (filterPreset) {
            console.log('Applying filter:', {
                filterId,
                parameters: filterPreset.parameters
            });
            applyFilter(currentMedia.id, filterId, filterPreset.parameters);
        }
    }, [currentMedia, applyFilter, clearFilter]);
    
    // Apply custom filter parameters
    const updateFilterParams = useCallback((params: Partial<FilterParameters>) => {
        if (!currentMedia) return;
        
        const newParams = { ...currentFilterParams, ...params };
        
        // Find if the parameters match any preset
        const matchingPreset = FILTER_PRESETS.find(preset => {
            const presetParams = preset.parameters;
            // Check if all preset parameters match
            return Object.keys(presetParams).every(key => {
                return presetParams[key as keyof FilterParameters] === newParams[key as keyof FilterParameters];
            });
        });
        
        if (matchingPreset) {
            applyFilter(currentMedia.id, matchingPreset.id, newParams);
        } else {
            // Custom filter
            applyFilter(currentMedia.id, 'custom', newParams);
        }
    }, [currentMedia, currentFilterParams, applyFilter]);
    
    return {
        currentMedia,
        currentFilterId,
        currentFilterParams,
        selectFilter,
        updateFilterParams,
        availableFilters: FILTER_PRESETS
    };
} 