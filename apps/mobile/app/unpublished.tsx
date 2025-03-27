import { toast } from '@backpackapp-io/react-native-toast';
import type NDK from '@nostr-dev-kit/ndk-mobile';
import { type NDKPublishError, useNDK, useNDKUnpublishedEvents } from '@nostr-dev-kit/ndk-mobile';
import type { UnpublishedEventEntry } from '@nostr-dev-kit/ndk-mobile/src/stores/ndk';
import type { RenderTarget } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';

const renderItem = (
    ndk: NDK,
    entry: UnpublishedEventEntry,
    index: number,
    target: RenderTarget
) => {
    const discard = () => {
        ndk?.cacheAdapter?.discardUnpublishedEvent?.(entry.event.id);
    };

    return (
        <ListItem
            item={{
                title: `Kind ${entry.event.kind}`,
                subTitle: entry.relays?.join(', '), //user.npub.slice(0, 10)
            }}
            index={index}
            target={target}
            onPress={async () => {
                try {
                    entry.event.ndk = ndk;
                    await entry.event.publish();
                    toast.success('Event published');
                } catch (e: unknown) {
                    const error = e as NDKPublishError;
                    console.error('error publishing', entry.event.id, error);
                    toast.error(`Error publishing event: ${error.message}`);
                    error.errors.forEach((message, relay) => {
                        toast.error(`Error publishing event to ${relay.url}: ${message}`);
                        console.error('error publishing', message, relay.url);
                    });
                }
            }}
            onLongPress={() => {}}
            rightView={
                <TouchableOpacity onPress={discard}>
                    <Text className="pr-4 text-primary">Discard</Text>
                </TouchableOpacity>
            }
        />
    );
};

export default function Unpublished() {
    const { ndk } = useNDK();
    const unpublishedEvents = useNDKUnpublishedEvents();

    const discardAll = () => {
        for (const entry of unpublishedEvents) {
            ndk?.cacheAdapter?.discardUnpublishedEvent?.(entry.event.id);
        }

        router.back();
    };

    const publishAll = async () => {
        for (const entry of unpublishedEvents.values()) {
            try {
                entry.event.ndk = ndk;
                await entry.event.publish();
            } catch (e) {
                console.error('error publishing', entry.event.id, e);
                toast.error(`Error publishing event: ${e.message}`);
                break;
            }
        }
    };

    const sortedUnpublishedEvents = useMemo(() => {
        return Array.from(unpublishedEvents.entries()).sort((a, b) => {
            return b[1].event.created_at - a[1].event.created_at;
        });
    }, [unpublishedEvents]);

    return (
        <View className="flex-1">
            <LargeTitleHeader
                title="Unpublished events"
                leftView={() => (
                    <TouchableOpacity onPress={discardAll}>
                        <Text className="text-primary">Discard All</Text>
                    </TouchableOpacity>
                )}
                rightView={() => (
                    <TouchableOpacity onPress={publishAll}>
                        <Text className="text-primary">Publish All</Text>
                    </TouchableOpacity>
                )}
            />

            <List
                data={sortedUnpublishedEvents}
                keyExtractor={([key]) => key}
                estimatedItemSize={78}
                renderItem={(info) => renderItem(ndk, info.item[1], info.index, info.target)}
            />
        </View>
    );
}
