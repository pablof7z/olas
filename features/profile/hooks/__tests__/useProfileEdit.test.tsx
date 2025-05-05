import * as ndkMobile from '@nostr-dev-kit/ndk-mobile';
import { act, renderHook } from '@testing-library/react-hooks';
import { Provider } from 'jotai';
import useProfileEdit from '../useProfileEdit';

jest.mock('@nostr-dev-kit/ndk-mobile', () => ({
    useNDK: jest.fn(() => ({ ndk: {} })),
    useNDKCurrentUser: jest.fn(() => ({ pubkey: 'user_pubkey' })),
    useSetProfile: jest.fn(() => jest.fn()),
}));

describe('useProfileEdit', () => {
    it('should initialize and handle edit state transitions', () => {
        const wrapper = ({ children }: React.PropsWithChildren<object>) => (
            <Provider>{children}</Provider>
        );
        const { result } = renderHook(() => useProfileEdit({ name: 'Alice' }), { wrapper });

        // Initial state
        expect(result.current.editState).toBeNull();
        expect(result.current.editProfile).toBeNull();

        // Start editing
        act(() => {
            result.current.startProfileEdit();
        });
        expect(result.current.editState).toBe('edit');
        expect(result.current.editProfile).toEqual({ name: 'Alice' });

        // Cancel editing
        act(() => {
            result.current.cancelProfileEdit();
        });
        expect(result.current.editState).toBeNull();
        expect(result.current.editProfile).toBeNull();
    });

    it('should call updateProfile and reset state on save', async () => {
        const updateProfile = jest.fn();
        (ndkMobile.useSetProfile as jest.Mock).mockReturnValue(updateProfile);
        (ndkMobile.useNDK as jest.Mock).mockReturnValue({ ndk: {} });

        const wrapper = ({ children }: React.PropsWithChildren<object>) => (
            <Provider>{children}</Provider>
        );
        const { result } = renderHook(() => useProfileEdit({ name: 'Bob', about: undefined }), {
            wrapper,
        });

        act(() => {
            result.current.startProfileEdit();
        });

        await act(async () => {
            await result.current.saveProfileEdit();
        });

        expect(updateProfile).toHaveBeenCalledWith({ name: 'Bob' }); // about: null should be filtered out
        expect(result.current.editState).toBeNull();
    });
});
