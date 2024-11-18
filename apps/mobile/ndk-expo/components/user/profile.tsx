import React, { createContext, useContext, useState, useEffect } from 'react';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNDK } from '@/ndk-expo';

interface UserProfileContextProps {
  userProfile: NDKUserProfile | null;
  user: NDKUser | null;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextProps | undefined>(undefined);

interface UserProfileProviderProps {
  pubkey?: string;
  npub?: string;
  children: React.ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  pubkey,
  npub,
  children,
}) => {
  const { ndk } = useNDK();
  const [userProfile, setUserProfile] = useState<NDKUserProfile | null>(null);
  const [user, setUser] = useState<NDKUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!ndk) return;
    setLoading(true);
    const fetchedUser = ndk.getUser({ pubkey, npub });
    setUser(fetchedUser);
    fetchedUser
      .fetchProfile()
      .then(setUserProfile)
      .finally(() => setLoading(false));
  }, [ndk, pubkey]);

  return (
    <UserProfileContext.Provider value={{ userProfile, user, loading }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
