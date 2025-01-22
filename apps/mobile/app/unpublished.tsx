import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { TouchableOpacity, View } from 'react-native';
import { RenderTarget } from '@shopify/flash-list';
import { router } from 'expo-router';
import NDK, { useNDK, useNDKUnpublishedEvents } from '@nostr-dev-kit/ndk-mobile';
import { UnpublishedEventEntry } from '@nostr-dev-kit/ndk-mobile/src/stores/ndk';
import { toast } from '@backpackapp-io/react-native-toast';
import { useMemo } from 'react';

const renderItem = (ndk: NDK, entry: UnpublishedEventEntry, index: number, target: RenderTarget) => {
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
                console.log(JSON.stringify(entry.event.rawEvent(), null, 2));
                try {
                    entry.event.ndk = ndk;
                    await entry.event.publish();
                    toast.success('Event published');
                } catch (e) {
                    console.error('error publishing', entry.event.id, e);
                    toast.error('Error publishing event: ' + e.message);
                }
            }}
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
        for (let entry of unpublishedEvents) {
            ndk?.cacheAdapter?.discardUnpublishedEvent?.(entry.event.id);
        }

        router.back();
    };

    const publishAll = async () => {
        for (let entry of unpublishedEvents.values()) {
            console.log('publishing', entry.event.id);
            try {
                entry.event.ndk = ndk;
                await entry.event.publish();
            } catch (e) {
                console.error('error publishing', entry.event.id, e);
                toast.error('Error publishing event: ' + e.message);
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
