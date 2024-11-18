import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
} from 'react';
import {
    NDKSubscriptionCacheUsage,
    NDKUser,
    NDKUserProfile,
} from '@nostr-dev-kit/ndk';
import { useNDK, useSubscribe } from '@/ndk-expo';

interface UserProfileContextProps {
    userProfile: NDKUserProfile | null;
    user: NDKUser | null;
    loading: boolean;
    hasKind20: boolean;
}

const UserProfileContext = createContext<UserProfileContextProps | undefined>(
    undefined
);

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

    const filters = useMemo(
        () => [{ kinds: [20], authors: [user?.pubkey!], limit: 1 }],
        [user?.pubkey]
    );
    const opts = useMemo(
        () => ({
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
            groupable: false,
            closeOnEose: true,
        }),
        []
    );
    const { events: kind20Events } = useSubscribe({ filters, opts });

    return (
        <UserProfileContext.Provider
            value={{
                userProfile,
                user,
                loading,
                hasKind20: kind20Events.length > 0,
            }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error(
            'useUserProfile must be used within a UserProfileProvider'
        );
    }
    return context;
};
