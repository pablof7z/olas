import { act, renderHook } from '@testing-library/react-hooks';
import { useMediaFilterStore } from '../store';
import { FILTER_PRESETS } from '../presets';

describe('MediaFilterStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useMediaFilterStore());
        act(() => {
            result.current.reset();
        });
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useMediaFilterStore());

        expect(result.current.sourceUri).toBeNull();
        expect(result.current.currentFilter).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should set source URI', () => {
        const { result } = renderHook(() => useMediaFilterStore());
        const testUri = 'file:///test/image.jpg';

        act(() => {
            result.current.setSource(testUri, 100, 200);
        });

        expect(result.current.sourceUri).toBe(testUri);
        expect(result.current.sourceWidth).toBe(100);
        expect(result.current.sourceHeight).toBe(200);
        expect(result.current.currentFilter).toBeNull();
    });

    it('should apply a filter', () => {
        const { result } = renderHook(() => useMediaFilterStore());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS[1]; // Get a non-normal filter

        act(() => {
            result.current.setSource(testUri);
        });

        act(() => {
            result.current.applyFilter(testFilter.id, testFilter.parameters);
        });

        expect(result.current.currentFilter).not.toBeNull();
        expect(result.current.currentFilter?.id).toBe(testFilter.id);
        expect(result.current.currentFilter?.parameters).toEqual(testFilter.parameters);
    });

    it('should update filter parameters', () => {
        const { result } = renderHook(() => useMediaFilterStore());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS[1];

        act(() => {
            result.current.setSource(testUri);
            result.current.applyFilter(testFilter.id, testFilter.parameters);
        });

        const updatedParams = { brightness: 1.5 };

        act(() => {
            result.current.updateFilterParams(updatedParams);
        });

        expect(result.current.currentFilter?.parameters.brightness).toBe(1.5);
    });

    it('should clear filter', () => {
        const { result } = renderHook(() => useMediaFilterStore());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS[1];

        act(() => {
            result.current.setSource(testUri);
            result.current.applyFilter(testFilter.id, testFilter.parameters);
        });

        expect(result.current.currentFilter).not.toBeNull();

        act(() => {
            result.current.clearFilter();
        });

        expect(result.current.currentFilter).toBeNull();
    });

    it('should reset all state', () => {
        const { result } = renderHook(() => useMediaFilterStore());
        const testUri = 'file:///test/image.jpg';
        const testFilter = FILTER_PRESETS[1];

        act(() => {
            result.current.setSource(testUri, 100, 200);
            result.current.applyFilter(testFilter.id, testFilter.parameters);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.sourceUri).toBeNull();
        expect(result.current.currentFilter).toBeNull();
        expect(result.current.sourceWidth).toBeNull();
        expect(result.current.sourceHeight).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});
