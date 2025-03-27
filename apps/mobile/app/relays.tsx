import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import React, { useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';

import { List, ListItem, ListItemProps } from '@/components/nativewindui/List';
import AvatarGroup from '@/components/ui/user/AvatarGroup';

const RelayListItem: React.FC<
    ListItemProps<{
        id: string;
        title: string;
    }>
> = ({ item, index, target }) => {
    const groupFilters = useMemo(() => [{ kinds: [NDKKind.GroupMembers - 1] }], [item.title]);
    const opts = useMemo(
        () => ({
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
        }),
        []
    );
    const { events: groupEvents } = useSubscribe(groupFilters, opts, [item.title]);

    const adminPubkeys = useMemo(() => groupEvents.map((event) => event.getMatchingTags('p').map((tag) => tag[1])).flat(), [groupEvents]);

    return (
        <ListItem item={item} index={index} target={target}>
            <AvatarGroup pubkeys={adminPubkeys} avatarSize={6} threshold={5} />
        </ListItem>
    );
};

const RelayListScreen: React.FC = () => {
    const filters = useMemo(
        () => [
            {
                kinds: [30166],
                '#N': ['29'],
                authors: ['9bbbb845e5b6c831c29789900769843ab43bb5047abe697870cb50b6fc9bf923'],
            },
        ],
        []
    );

    const opts = useMemo(
        () => ({
            relays: ['wss://relay.nostr.watch'],
            closeOnEose: true,
        }),
        []
    );

    const { events } = useSubscribe(filters, opts);

    const listData = useMemo(
        () =>
            events.map((event) => ({
                id: event.id,
                title: event.dTag!,
            })),
        [events]
    );

    const renderRelayListItem = ({ item, index }: { item: { id: string; title: string }; index: number }) => (
        <RelayListItem item={item} index={index} target={undefined} />
    );

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <List data={listData} keyExtractor={(item) => item.id} renderItem={renderRelayListItem} />
        </View>
    );
};

export default RelayListScreen;
