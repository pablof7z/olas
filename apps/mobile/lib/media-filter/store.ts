import { create } from 'zustand';

import { FILTER_PRESETS } from './presets';
import { FilterParameters, FilterState } from './types';

interface MediaFilterStore {
    // Current source image URI being edited
    sourceUri: string | null;

    // Current filter state
    currentFilter: FilterState | null;

    // Source image dimensions
    sourceWidth: number | null;
    sourceHeight: number | null;

    // Loading state
    isLoading: boolean;

    // Actions
    setSource: (uri: string, width?: number, height?: number) => void;

    applyFilter: (filterId: string, parameters: FilterParameters) => void;

    updateFilterParams: (params: Partial<FilterParameters>) => void;

    clearFilter: () => void;

    reset: () => void;
}

export const useMediaFilterStore = create<MediaFilterStore>((set, get) => ({
    sourceUri: null,
    currentFilter: null,
    sourceWidth: null,
    sourceHeight: null,
    isLoading: false,

    setSource: (uri, width, height) =>
        set({
            sourceUri: uri,
            sourceWidth: width || null,
            sourceHeight: height || null,
            // Reset filter when changing source
            currentFilter: null,
        }),

    applyFilter: (filterId, parameters) => {
        console.log('Media Filter Store - Applying filter:', {
            filterId,
            parameters,
        });

        set({
            currentFilter: {
                id: filterId,
                parameters: { ...parameters },
            },
        });
    },

    updateFilterParams: (params) => {
        const currentFilter = get().currentFilter;
        if (!currentFilter) {
            // If no filter is applied, start with normal
            const normalPreset = FILTER_PRESETS.find((preset) => preset.id === 'normal');
            set({
                currentFilter: {
                    id: 'custom',
                    parameters: { ...(normalPreset?.parameters || {}), ...params },
                },
            });
            return;
        }

        // Update existing filter parameters
        const newParams = { ...currentFilter.parameters, ...params };

        // Find if the parameters match any preset
        const matchingPreset = FILTER_PRESETS.find((preset) => {
            const presetParams = preset.parameters;
            if (Object.keys(presetParams).length === 0 && Object.keys(newParams).length === 0) {
                return true;
            }

            // Check if all parameters match
            return Object.keys(presetParams).every((key) => {
                const paramKey = key as keyof FilterParameters;
                return presetParams[paramKey] === newParams[paramKey];
            });
        });

        if (matchingPreset) {
            set({
                currentFilter: {
                    id: matchingPreset.id,
                    parameters: newParams,
                },
            });
        } else {
            // Custom filter
            set({
                currentFilter: {
                    id: 'custom',
                    parameters: newParams,
                },
            });
        }
    },

    clearFilter: () =>
        set({
            currentFilter: null,
        }),

    reset: () =>
        set({
            sourceUri: null,
            currentFilter: null,
            sourceWidth: null,
            sourceHeight: null,
            isLoading: false,
        }),
}));
