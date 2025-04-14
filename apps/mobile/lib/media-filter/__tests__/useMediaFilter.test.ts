import { act, renderHook } from '@testing-library/react-native';

import { useMediaFilter } from '../hooks/useMediaFilter';
import { FILTER_PRESETS } from '../presets';
import { useMediaFilterStore } from '../store';

// Mock the entire module
jest.mock('../utils/saveFilteredImage', () => ({
    saveFilteredImage: jest.fn().mockResolvedValue('file:///test/filtered-image.jpg'),
}));

describe('useMediaFilter hook', () => {
    beforeEach(() => {
        // Reset the store before each test
        const { result } = renderHook(() => useMediaFilterStore());
        act(() => {
            result.current.reset();
        });

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useMediaFilter());

        expect(result.current.sourceUri).toBeNull();
        expect(result.current.currentFilterId).toBe('normal');
        expect(result.current.currentFilterParams).toEqual({});
    });

    it('should set source URI', () => {
        const { result } = renderHook(() => useMediaFilter());
        const testUri = 'file:///test/image.jpg';

        act(() => {
            result.current.setSource(testUri);
        });

        expect(result.current.sourceUri).toBe(testUri);
    });

    it('should select a filter', () => {
        const { result } = renderHook(() => useMediaFilter());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS.find((f) => f.id !== 'normal');

        act(() => {
            result.current.setSource(testUri);
        });

        act(() => {
            result.current.selectFilter(testFilter!.id);
        });

        expect(result.current.currentFilterId).toBe(testFilter!.id);
        expect(result.current.currentFilterParams).toEqual(testFilter!.parameters);
    });

    it('should not select a filter if no source is set', () => {
        const { result } = renderHook(() => useMediaFilter());
        const testFilter = FILTER_PRESETS.find((f) => f.id !== 'normal');

        act(() => {
            result.current.selectFilter(testFilter!.id);
        });

        // Should remain on the default filter
        expect(result.current.currentFilterId).toBe('normal');
    });

    it('should clear filter when selecting normal', () => {
        const { result } = renderHook(() => useMediaFilter());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS.find((f) => f.id !== 'normal')!;

        act(() => {
            result.current.setSource(testUri);
        });

        act(() => {
            result.current.selectFilter(testFilter.id);
        });

        // Verify the filter was applied
        expect(result.current.currentFilterId).toBe(testFilter.id);

        act(() => {
            result.current.selectFilter('normal');
        });

        expect(result.current.currentFilterId).toBe('normal');
        expect(result.current.currentFilterParams).toEqual({});
    });

    it.skip('should save filtered image', async () => {
        const { saveFilteredImage } = require('../utils/saveFilteredImage');

        const { result } = renderHook(() => useMediaFilter());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS.find((f) => f.id !== 'normal')!;

        act(() => {
            result.current.setSource(testUri);
            result.current.selectFilter(testFilter.id);
        });

        let savedUri: string | null = null;

        await act(async () => {
            savedUri = await result.current.saveImage();
        });

        expect(savedUri).toBe('file:///test/filtered-image.jpg');
        expect(saveFilteredImage).toHaveBeenCalledWith(testUri, testFilter.parameters);
    });

    it('should not save image if no filter is applied', async () => {
        const { result } = renderHook(() => useMediaFilter());
        const testUri = 'file:///test/image.jpg';

        act(() => {
            result.current.setSource(testUri);
        });

        let savedUri: string | null = null;

        await act(async () => {
            savedUri = await result.current.saveImage();
        });

        expect(savedUri).toBeNull();
    });

    it('should provide available filters', () => {
        const { result } = renderHook(() => useMediaFilter());
        expect(result.current.availableFilters).toEqual(FILTER_PRESETS);
    });
});
