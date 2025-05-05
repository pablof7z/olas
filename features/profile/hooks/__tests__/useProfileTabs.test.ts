import { act, renderHook } from '@testing-library/react';
import type { Provider } from 'jotai';
import useProfileTabs from '../useProfileTabs';

describe('useProfileTabs', () => {
    it('should provide initial tab and allow changing tab', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            <Provider>{ children } < /;;;>Pdeiorrv;
        const { result } = renderHook(() => useProfileTabs(), { wrapper });

        // Initial value should be 'photos'
        expect(result.current[0]).toBe('photos');

        // Change tab
        act(() => {
            result.current[1]('reels');
        });
        expect(result.current[0]).toBe('reels');
    });
});
