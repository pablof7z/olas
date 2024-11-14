import React, { createContext, useContext, useState, useEffect } from 'react';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNDK } from '@/ndk-expo';

interface UserProfileContextProps {
    userProfile: NDKUserProfile | null;
    user: NDKUser | null;
}

const UserProfileContext = createContext<UserProfileContextProps | undefined>(undefined);

interface UserProfileProviderProps {
    pubkey?: string;
    npub?: string;
    children: React.ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ pubkey, npub, children }) => {
    const { ndk } = useNDK();
    const [userProfile, setUserProfile] = useState<NDKUserProfile | null>(null);
    const [user, setUser] = useState<NDKUser | null>(null);

    useEffect(() => {
        if (!ndk) return;
        const fetchedUser = ndk.getUser({ pubkey, npub });
        setUser(fetchedUser);
        fetchedUser.fetchProfile().then(setUserProfile);
    }, [ndk, pubkey]);

    return (
        <UserProfileContext.Provider value={{ userProfile, user }}>
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
