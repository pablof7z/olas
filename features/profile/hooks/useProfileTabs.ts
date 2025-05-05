import { useAtom } from 'jotai';
import { profileContentViewAtom } from '../atoms';

/**
 * Hook to manage the current profile tab/view.
 * @returns The current view and a setter function.
 */
function useProfileTabs(): [string, (view: string) => void] {
  return useAtom(profileContentViewAtom);
}

export default useProfileTabs;