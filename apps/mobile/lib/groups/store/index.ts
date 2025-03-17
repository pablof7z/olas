import NDK, { Hexpubkey, NDKUser, useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';
import { loadGroups, loadMyGroups } from './load';
import { useEffect } from 'react';
import { GroupEntry } from '../types';

export type GroupStoreState = {
    groups: Map<string, GroupEntry>;
    myGroups: Set<GroupEntry>;

    myGroupsLoaded: boolean;
    groupsLoaded: Set<string>;
};

type GroupStoreActions = {
    addGroup: (group: GroupEntry) => void;
    loadGroups: (ndk: NDK, currentUser: NDKUser, relay: string, groupIds?: string[]) => void;

    loadMyGroups: (ndk: NDK, currentUser: NDKUser) => void;
};

export type GroupStore = GroupStoreState & GroupStoreActions;

export const useGroups = create<GroupStore>()((set) => ({
    groups: new Map(),
    myGroups: new Set(),
    myGroupsLoaded: false,
    groupsLoaded: new Set(),

    addGroup: (group) => set((state) => ({ groups: state.groups.set(group.groupId, group) })),
    loadGroups: (ndk, currentUser, relay, groupIds) => loadGroups(ndk, currentUser, relay, groupIds, set),

    loadMyGroups: (ndk, currentUser) => loadMyGroups(ndk, currentUser, set),
}));

export function useAllGroups(relayUrls: string[]) {
    const groups = useGroups((state) => state.groups);
    const groupsLoaded = useGroups((state) => state.groupsLoaded);
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const loadGroups = useGroups((state) => state.loadGroups);

    useEffect(() => {
        if (!ndk || !currentUser) return;

        for (const relayUrl of relayUrls) {
            console.log('loading from relayUrl', relayUrl);
            if (groupsLoaded.has(relayUrl)) continue;
            console.log('loading groups from relayUrl', relayUrl);
            loadGroups(ndk, currentUser, relayUrl);
        }
    }, [ndk, currentUser, relayUrls]);

    return Array.from(groups.values());
}

export function useMyGroups() {
    const myGroups = useGroups((state) => state.myGroups);
    const myGroupsLoaded = useGroups((state) => state.myGroupsLoaded);
    const loadMyGroups = useGroups((state) => state.loadMyGroups);
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();

    useEffect(() => {
        if (!ndk || !currentUser) return;
        if (!myGroupsLoaded) {
            loadMyGroups(ndk, currentUser);
        }
    }, [myGroupsLoaded, ndk, currentUser]);

    return myGroups;
}

export function useGroup(groupId?: string, relayUrl?: string) {
    const groups = useGroups((state) => state.groups);
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const loadGroups = useGroups((state) => state.loadGroups);
    if (!groupId) return null;

    const group = groups.get(groupId);

    if (!group) {
        loadGroups(ndk, currentUser, relayUrl, [groupId]);
    }

    return group;
}
