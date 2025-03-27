import NDK, { NDKFilter, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useLocalSearchParams } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';

import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { relayNoticesAtom } from '@/stores/relays';

type Row = {
    id: string;
    filters: NDKFilter[];
    rawFilters: NDKFilter[];
    count: number;
};

function subscriptions({ relayUrl, ndk }: { relayUrl?: string; ndk: NDK }) {
    const relay = ndk.pool.getRelay(relayUrl);
    const subManager = relay.subs;

    const rows: Row[] = [];

    if (!relayUrl || !relay.connected) return rows;

    for (const [id, subscriptions] of subManager.subscriptions) {
        const row = {
            id,
            filters: subscriptions.flatMap((s) => s.executeFilters),
            rawFilters: subscriptions.flatMap((s) => s.executeFilters),
            count: subscriptions.length,
        };

        // go through each filter, look at the values, if any of them has more than 4 elements, replace the value with a string saying "x values"
        row.filters = row.filters.map((filter) => {
            const f: NDKFilter = filter;

            for (const [key, value] of Object.entries(f)) {
                if (Array.isArray(value) && JSON.stringify(value).length > 100) {
                    f[key] = `${value.length} values`;
                }
            }

            return f;
        });

        rows.push(row);
    }

    return rows;
}

export default function RelayScreen() {
    const { ndk } = useNDK();
    const { relayUrl } = useLocalSearchParams() as { relayUrl: string };
    const relayNotices = useAtomValue(relayNoticesAtom);

    const notices = useMemo(() => {
        if (!relayUrl) return [];
        return relayNotices[relayUrl] || [];
    }, [relayUrl]);

    const subsData = subscriptions({ relayUrl, ndk });

    const show = useCallback((filters: NDKFilter[]) => {
        console.log(JSON.stringify(filters, null, 4));
    }, []);

    return (
        <View className="flex-1">
            <Text>
                {relayUrl} ({subsData.length})
            </Text>

            <List
                data={subsData}
                estimatedItemSize={40}
                renderItem={({ item, index, target }) => (
                    <ListItem
                        index={index}
                        target={target}
                        item={{
                            id: item.id,
                            title: item.id,
                            badge: item.count,
                        }}>
                        <TouchableOpacity onPress={() => show(item.rawFilters)}>
                            <View className="flex-col">
                                {item.filters.map((filter, index) => (
                                    <Text key={index} className="font-mono">
                                        {JSON.stringify(filter)}
                                    </Text>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </ListItem>
                )}
            />
            {/* 
        <FlatList
            data={notices}
            renderItem={({item}) => <Text>{item.toString()}</Text>}
        /> */}
        </View>
    );
}
