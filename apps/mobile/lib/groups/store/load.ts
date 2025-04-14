import type NDK from '@nostr-dev-kit/ndk-mobile';
import {
    type NDKEvent,
    type NDKFilter,
    NDKKind,
    NDKList,
    type NDKRelay,
    NDKRelaySet,
    NDKSimpleGroupMemberList,
    NDKSimpleGroupMetadata,
    NDKSubscriptionCacheUsage,
    type NDKUser,
    useNDK,
    useNDKCurrentUser,
} from '@nostr-dev-kit/ndk-mobile';

import type { GroupStore } from '.';

export function loadMyGroups(ndk: NDK, currentUser: NDKUser, set: (state: GroupStore) => void) {
    ndk.subscribe(
        [{ kinds: [NDKKind.SimpleGroupList], authors: [currentUser.pubkey] }],
        undefined,
        undefined,
        {
            onEvent: (event) => {
                const list = NDKList.from(event);
                const relays = new Map<string, string[]>();
                list.items.forEach((item) => {
                    const [_, hTag, relay] = item;
                    const existing = relays.get(relay) || [];
                    existing.push(hTag);
                    relays.set(relay, existing);
                });

                relays.forEach((hTags, relay) => {
                    loadGroups(ndk, currentUser, relay, hTags, set);
                });
            },
        }
    );
}

export function loadGroups(
    ndk: NDK,
    currentUser: NDKUser,
    relay: string,
    groupIds: string[] | undefined,
    set: (state: GroupStore) => void
) {
    const handleEvent = (event: NDKEvent, relay?: NDKRelay) => {
        const groupId = event.dTag;
        set((state: GroupStore) => {
            const current = state.groups.get(groupId) ?? {
                groupId,
                members: new Set(),
                relayUrls: event.onRelays.map((r) => r.url),
            };

            if (relay && !current.relayUrls.includes(relay.url)) {
                current.relayUrls.push(relay.url);
            }

            if (event.kind === NDKSimpleGroupMetadata.kind) {
                const wrappedEvent = NDKSimpleGroupMetadata.from(event);
                current.name = wrappedEvent.name;
                current.about = wrappedEvent.about;
                current.picture = wrappedEvent.picture;
            } else if (event.kind === 39002) {
                const list = NDKSimpleGroupMemberList.from(event);
                current.members = list.memberSet;
            }

            if (currentUser?.pubkey && current.members.has(currentUser.pubkey)) {
                state.myGroups.add(current);
            }

            const newState = new Map(state.groups);
            newState.set(groupId, current);
            return { ...state, groups: newState };
        });
    };

    const relaySet = NDKRelaySet.fromRelayUrls([relay], ndk);

    const filters: NDKFilter[] = [{ kinds: [39000, 39002] }];
    if (groupIds) filters[0]['#d'] = groupIds;

    ndk.subscribe(
        filters,
        {
            subId: 'groups-load',
            groupable: false,
            closeOnEose: true,
            cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
        },
        relaySet,
        {
            onEvent: handleEvent,
        }
    );
}
