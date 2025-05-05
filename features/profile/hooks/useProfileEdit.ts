import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useNDK, useNDKCurrentUser, useSetProfile } from '@nostr-dev-kit/ndk-mobile';
import { editProfileAtom, editStateAtom } from '../atoms';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';

/**
 * Hook to manage profile editing state and actions.
 * @param userProfile - The current user profile (optional, for pre-filling edit form)
 * @returns Editing state, profile being edited, and edit action handlers
 */
function useProfileEdit(userProfile?: NDKUserProfile | null) {
  const currentUser = useNDKCurrentUser();
  const updateProfile = useSetProfile();
  const { ndk } = useNDK();

  const [editState, setEditState] = useAtom(editStateAtom);
  const [editProfile, setEditProfile] = useAtom(editProfileAtom);

  const cancelProfileEdit = useCallback(() => {
    setEditState(null);
    setEditProfile(null);
  }, [setEditState, setEditProfile]);

  const startProfileEdit = useCallback(() => {
    setEditState('edit');
    setEditProfile(userProfile ?? null);
  }, [setEditState, setEditProfile, userProfile]);

  const saveProfileEdit = useCallback(async () => {
    setEditState('saving');
    if (!ndk) {
      // eslint-disable-next-line no-console
      console.error('NDK not available to save profile.');
      setEditState('edit');
      return;
    }
    const profileWithoutEmptyValues = Object.fromEntries(
      Object.entries(editProfile || {}).filter(([_, value]) => value !== null)
    );
    updateProfile(profileWithoutEmptyValues);
    setEditState(null);
  }, [editProfile, setEditState, updateProfile, ndk]);

  return {
    editState,
    editProfile,
    setEditProfile,
    cancelProfileEdit,
    startProfileEdit,
    saveProfileEdit,
    currentUser,
  };
}

export default useProfileEdit;