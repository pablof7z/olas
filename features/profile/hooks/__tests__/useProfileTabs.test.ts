import { renderHook, act } from '@testing-library/react';
import { Provider } from 'jotai';
import useProfileTabs from '../useProfileTabs';

describe('useProfileTabs', () => {
  it('should provide initial tab and allow changing tab', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>;
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